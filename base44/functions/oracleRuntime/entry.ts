import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { boot } from '../../shared/runtime/bootLoader.ts';
import { logger } from '../../shared/runtime/logger.ts';

const DIVISIONS = new Set([
  'command', 'intelligence', 'operations', 'compliance', 'security', 'support',
  'logistics', 'humanitarian', 'reconnaissance', 'finance', 'markets', 'portfolio',
  'risk', 'navigation', 'records', 'communications',
]);

function routingPlan(routing = {}) {
  const leadDivision = DIVISIONS.has(routing.leadDivision)
    ? routing.leadDivision
    : DIVISIONS.has(routing.specialist)
      ? routing.specialist
      : 'operations';
  const collaborators = Array.isArray(routing.collaborators)
    ? routing.collaborators.filter((division) => DIVISIONS.has(division) && division !== leadDivision).slice(0, 3)
    : [];
  return {
    leadDivision,
    collaborators,
    divisions: [leadDivision, ...collaborators],
    confidence: routing.confidence || 'medium',
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { message, context, action = 'process' } = body;

    const { services, runtime, stages: bootStages } = await boot(base44);

    if (action === 'health') {
      const health = await services.health.runAll();
      return Response.json({ status: 'ok', health, stages: bootStages || [] });
    }

    if (!message) return Response.json({ error: 'Message is required' }, { status: 400 });

    const request = {
      id: crypto.randomUUID(),
      userId: user.id,
      message,
      context: {
        userId: user.id,
        sessionId: context?.sessionId || crypto.randomUUID(),
        userRole: user.role,
        operatorRole: context?.operatorRole || null,
        operatorDepartment: context?.operatorDepartment || null,
        operatorCapabilities: context?.operatorCapabilities || [],
        timestamp: new Date().toISOString(),
        source: 'bud',
      },
      capabilities: context?.capabilities || ['reasoning', 'knowledge'],
      priority: context?.priority || 'normal',
    };

    const response = await runtime.oracle.process(request);

    const thread = await services.conversation.getOrCreateThread(user.id, 'AI Assistant');
    await services.conversation.addMessage(thread.id, user.id, 'user', message);
    await services.conversation.addMessage(thread.id, user.id, 'assistant', response.content);
    await services.metrics.increment('ai_requests', 1, { userId: user.id });

    let workspaceId = null;
    let workItemId = null;
    let recommendationId = null;
    let pendingApproval = false;
    const plan = routingPlan(response.routing);
    const now = new Date().toISOString();
    const recommendationExists = Boolean(response.recommendation);
    const lifecycleStage = recommendationExists ? 'recommend' : 'assess';
    const authorizationState = recommendationExists ? 'required' : 'not_required';

    try {
      const existingWorkspaces = await base44.asServiceRole.entities.CaseWorkspace.filter({
        user_id: user.id,
        status: { $in: ['open', 'pending_review', 'pending_approval'] },
      });

      let workspace;
      if (existingWorkspaces.length > 0) {
        workspace = existingWorkspaces[0];
        const participating = Array.from(new Set([
          ...(workspace.participating_divisions || []),
          ...plan.divisions,
        ])).slice(0, 6);
        const timeline = workspace.timeline ? JSON.parse(workspace.timeline) : [];
        timeline.push({
          timestamp: now,
          event: 'institutional_assessment',
          leadDivision: plan.leadDivision,
          collaborators: plan.collaborators,
          lifecycleStage,
          summary: message.substring(0, 200),
        });
        workspace = await base44.asServiceRole.entities.CaseWorkspace.update(workspace.id, {
          case_type: plan.leadDivision,
          lead_division: plan.leadDivision,
          participating_divisions: participating,
          lifecycle_stage: lifecycleStage,
          authorization_state: recommendationExists ? 'required' : workspace.authorization_state || 'not_required',
          thread_id: thread.id,
          objective: workspace.objective || message.substring(0, 300),
          timeline: JSON.stringify(timeline.slice(-30)),
          status: recommendationExists ? 'pending_review' : workspace.status,
          priority: response.escalate ? 'high' : (workspace.priority || 'medium'),
          escalated: Boolean(response.escalate),
        });
      } else {
        const timeline = [{
          timestamp: now,
          event: 'case_created',
          leadDivision: plan.leadDivision,
          collaborators: plan.collaborators,
          lifecycleStage,
          summary: message.substring(0, 200),
        }];
        workspace = await base44.asServiceRole.entities.CaseWorkspace.create({
          user_id: user.id,
          subject: message.substring(0, 120),
          objective: message.substring(0, 300),
          case_type: plan.leadDivision,
          lead_division: plan.leadDivision,
          participating_divisions: plan.divisions,
          lifecycle_stage: lifecycleStage,
          status: recommendationExists ? 'pending_review' : 'open',
          authorization_state: authorizationState,
          execution_state: 'not_started',
          verification_state: 'not_started',
          thread_id: thread.id,
          timeline: JSON.stringify(timeline),
          evidence: JSON.stringify({ sources: response.sources || [], confidence: plan.confidence }),
          priority: response.escalate ? 'high' : 'medium',
          escalated: Boolean(response.escalate),
          escalation_reason: response.escalate ? 'Command requires additional review before progression.' : '',
        });
      }
      workspaceId = workspace.id;

      const existingWorkItems = await base44.asServiceRole.entities.InstitutionalWorkItem.filter({
        workspace_id: workspace.id,
        work_status: { $in: ['active', 'waiting', 'awaiting_authorization', 'verifying'] },
      });

      let workItem;
      const workPayload = {
        workspace_id: workspace.id,
        user_id: user.id,
        objective: workspace.objective || message.substring(0, 300),
        lead_division: plan.leadDivision,
        participating_divisions: plan.divisions,
        lifecycle_stage: lifecycleStage,
        work_status: recommendationExists ? 'awaiting_authorization' : 'active',
        authorization_state: authorizationState,
        execution_state: 'not_started',
        verification_state: 'not_started',
        evidence: JSON.stringify({ sources: response.sources || [], confidence: plan.confidence }),
        findings: JSON.stringify({ summary: response.metadata?.summary || response.content?.substring(0, 1000) || '' }),
        handoffs: JSON.stringify(plan.collaborators.map((division) => ({
          from: plan.leadDivision,
          to: division,
          status: 'requested',
          timestamp: now,
        }))),
        timeline: JSON.stringify([{ timestamp: now, stage: lifecycleStage, divisions: plan.divisions }]),
        updated_at: now,
      };

      if (existingWorkItems.length > 0) {
        workItem = await base44.asServiceRole.entities.InstitutionalWorkItem.update(existingWorkItems[0].id, workPayload);
      } else {
        workItem = await base44.asServiceRole.entities.InstitutionalWorkItem.create({ ...workPayload, created_at: now });
      }
      workItemId = workItem.id;

      if (response.recommendation) {
        const rec = response.recommendation;
        const isEscalation = Boolean(rec.is_escalation || response.escalate);
        const recommendation = await base44.asServiceRole.entities.AssistantRecommendation.create({
          workspace_id: workspace.id,
          work_item_id: workItem.id,
          user_id: user.id,
          specialist: plan.leadDivision,
          collaborating_divisions: plan.collaborators,
          member_message: message,
          summary: rec.summary || 'Recommendation prepared for staff review.',
          supporting_evidence: rec.supporting_evidence || JSON.stringify(response.sources || []),
          confidence_level: rec.confidence_level || plan.confidence,
          potential_risks: rec.potential_risks || '',
          applicable_policies: rec.applicable_policies || '',
          recommended_action: rec.recommended_action || '',
          required_approver: plan.leadDivision === 'compliance' ? 'compliance' : 'admin',
          status: isEscalation ? 'escalated' : 'pending',
          is_action_impacting: true,
          escalation_reason: isEscalation ? (rec.escalation_reason || 'Low confidence or conflicting evidence — escalated for staff review.') : '',
          collaboration_notes: plan.collaborators.length ? `Collaborating divisions: ${plan.collaborators.join(', ')}` : '',
        });
        recommendationId = recommendation.id;
        pendingApproval = true;

        await base44.asServiceRole.entities.InstitutionalWorkItem.update(workItem.id, {
          lifecycle_stage: 'recommend',
          work_status: 'awaiting_authorization',
          authorization_state: 'required',
          recommendation_ids: [recommendation.id],
          updated_at: new Date().toISOString(),
        });

        await services.audit.log({
          actionType: 'institutional_recommendation_created',
          description: `Command recommendation created by ${plan.leadDivision} with ${plan.collaborators.length} collaborating division(s)`,
          details: JSON.stringify({ workspaceId, workItemId, recommendationId, divisions: plan.divisions, confidence: rec.confidence_level, escalated: isEscalation }),
          targetUserId: user.id,
        });
      }
    } catch (persistError) {
      logger.error('Institutional work persistence failed', { error: persistError.message });
    }

    return Response.json({
      response: response.content,
      requestId: response.requestId,
      metadata: response.metadata,
      sources: response.sources,
      capabilities: response.capabilities,
      routing: { ...response.routing, ...plan, specialist: plan.leadDivision },
      workspaceId,
      workItemId,
      recommendationId,
      pendingApproval,
      escalated: response.escalate || false,
    });
  } catch (error) {
    logger.error('Oracle runtime error', { error: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
