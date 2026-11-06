import { WorkflowRegistry } from '../registries/WorkflowRegistry.ts';

/**
 * Persists prepared workflow records. This service does not approve or execute
 * financial operations; those require a separately verified executor.
 */
export function createWorkflowService(base44) {
  return {
    async prepare({
      workflowName,
      requesterId,
      requesterRole,
      subjectUserId = requesterId,
      idempotencyKey,
      payload = {},
      evidence = {},
      expiresAt = null,
    }) {
      const definition = WorkflowRegistry.resolve(workflowName);
      if (!definition || !definition.enabled) throw new Error('Workflow is unavailable');
      if (!requesterId || !idempotencyKey) throw new Error('Requester and idempotency key are required');
      if (String(idempotencyKey).length > 180) throw new Error('Idempotency key is too long');

      const existing = await base44.asServiceRole.entities.WorkflowRun.filter(
        { idempotency_key: String(idempotencyKey) },
        '-created_date',
        1,
      );
      if (existing?.length) return { run: existing[0], reused: true };

      const now = new Date().toISOString();
      const status = definition.approvalRequired ? 'pending_approval' : 'prepared';
      const events = [{
        at: now,
        type: 'workflow_prepared',
        actor_id: requesterId,
        actor_role: requesterRole || 'unknown',
        summary: 'Prepared for review; no controlled action has been executed.',
      }];

      const run = await base44.asServiceRole.entities.WorkflowRun.create({
        workflow_name: definition.name,
        workflow_version: definition.version,
        status,
        requester_id: requesterId,
        subject_user_id: subjectUserId,
        idempotency_key: String(idempotencyKey),
        current_step: definition.steps[0] || 'prepared',
        payload_json: JSON.stringify(payload).slice(0, 20000),
        evidence_json: JSON.stringify(evidence).slice(0, 20000),
        approval_json: '',
        result_json: '',
        event_log_json: JSON.stringify(events),
        execution_enabled: false,
        created_at: now,
        updated_at: now,
        expires_at: expiresAt || '',
      });

      return { run, reused: false };
    },

    async get(runId) {
      if (!runId) return null;
      return base44.asServiceRole.entities.WorkflowRun.get(runId);
    },

    listDefinitions() {
      return WorkflowRegistry.list();
    },
  };
}
