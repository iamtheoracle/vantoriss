import { createClientFromRequest } from "npm:@base44/sdk";

const ROLE_GROUPS = {
  admin: ['admin', 'administrator', 'super_administrator'],
  operations: ['admin', 'administrator', 'super_administrator', 'operations_officer', 'operations_manager'],
  compliance: ['admin', 'administrator', 'super_administrator', 'compliance_officer', 'risk_officer'],
  executive: ['admin', 'administrator', 'super_administrator', 'executive'],
};

function canReview(role, requiredApprover, isActionImpacting) {
  if (!isActionImpacting) {
    return [
      'admin', 'administrator', 'super_administrator', 'operations_officer',
      'operations_manager', 'compliance_officer', 'executive', 'finance_officer',
      'kyc_officer', 'treasury_officer', 'investment_officer', 'investment_manager',
      'auditor', 'risk_officer', 'it_administrator',
    ].includes(role);
  }
  const allowed = ROLE_GROUPS[requiredApprover] || ROLE_GROUPS.admin;
  return allowed.includes(role);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const recommendationId = String(body?.recommendationId || '').trim();
    const decision = body?.decision;
    const notes = String(body?.notes || '').trim();

    if (!recommendationId) return Response.json({ error: 'Recommendation ID is required' }, { status: 400 });
    if (!['approved', 'rejected'].includes(decision)) return Response.json({ error: 'Decision must be approved or rejected' }, { status: 400 });
    if (notes.length > 3000) return Response.json({ error: 'Review notes are too long' }, { status: 413 });

    const rec = await base44.asServiceRole.entities.AssistantRecommendation.get(recommendationId);
    if (!rec) return Response.json({ error: 'Recommendation not found' }, { status: 404 });
    if (!['pending', 'escalated'].includes(rec.status)) {
      return Response.json({ error: 'This recommendation has already been reviewed' }, { status: 409 });
    }
    if (!canReview(user.role, rec.required_approver, rec.is_action_impacting)) {
      return Response.json({ error: 'You are not authorized to review this recommendation' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const displayName = user.display_name || user.full_name || user.email || 'Authorized reviewer';

    await base44.asServiceRole.entities.AssistantRecommendation.update(recommendationId, {
      status: decision,
      reviewer_id: user.id,
      reviewer_name: displayName,
      review_notes: notes,
      reviewed_date: now,
    });

    if (rec.workspace_id) {
      try {
        const workspace = await base44.asServiceRole.entities.CaseWorkspace.get(rec.workspace_id);
        if (workspace) {
          let timeline = [];
          try { timeline = workspace.timeline ? JSON.parse(workspace.timeline) : []; } catch { timeline = []; }
          timeline.push({
            timestamp: now,
            event: `recommendation_${decision}`,
            reviewer: displayName,
            reviewer_role: user.role,
            notes,
          });
          await base44.asServiceRole.entities.CaseWorkspace.update(workspace.id, {
            status: decision,
            timeline: JSON.stringify(timeline.slice(-30)),
          });
        }
      } catch (error) {
        console.warn('Recommendation workspace timeline update failed', error?.message || 'unknown');
      }
    }

    if (rec.workflow_run_id) {
      try {
        const run = await base44.asServiceRole.entities.WorkflowRun.get(rec.workflow_run_id);
        if (run) {
          let events = [];
          try { events = run.event_log_json ? JSON.parse(run.event_log_json) : []; } catch { events = []; }
          events.push({
            at: now,
            type: `review_${decision}`,
            actor_id: user.id,
            actor_role: user.role,
            summary: 'Review decision recorded. No financial operation was executed.',
          });
          await base44.asServiceRole.entities.WorkflowRun.update(run.id, {
            current_step: 'review_recorded',
            approval_json: JSON.stringify({
              decision,
              reviewerId: user.id,
              reviewerRole: user.role,
              reviewerName: displayName,
              notes,
              decidedAt: now,
              executionEnabled: false,
            }),
            event_log_json: JSON.stringify(events.slice(-50)),
            updated_at: now,
            execution_enabled: false,
          });
        }
      } catch (error) {
        console.warn('Workflow review event could not be appended', error?.message || 'unknown');
      }
    }

    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      admin_name: displayName,
      target_user_id: rec.user_id,
      action_type: decision === 'approved' ? 'workflow_approved' : 'workflow_rejected',
      description: `Assistant recommendation ${decision}; no financial action executed.`,
      details: JSON.stringify({
        recommendation_id: recommendationId,
        workflow_run_id: rec.workflow_run_id || null,
        decision,
        reviewer_role: user.role,
        notes,
        execution_enabled: false,
      }),
    });

    return Response.json({
      success: true,
      recommendationId,
      status: decision,
      reviewedAt: now,
      executionEnabled: false,
      message: 'Review decision recorded. No financial or account operation was executed.',
    });
  } catch (error) {
    console.error('review-recommendation failed', error?.message || 'unknown');
    return Response.json({ error: 'Unable to record the review decision' }, { status: 500 });
  }
});
