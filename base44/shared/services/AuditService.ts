import { eventBus } from '../runtime/eventBus.ts';

export function createAuditService(base44) {
  return {
    async log(entry) {
      const record = await base44.asServiceRole.entities.AuditLog.create({
        action_type: entry.actionType || 'transaction_created',
        description: entry.description || '',
        details: entry.details || '',
        user_id: entry.actorId,
        target_user_id: entry.targetUserId,
        admin_name: entry.actorName,
        account_id: entry.accountId,
      });
      eventBus.publish({
        type: 'audit', source: 'auditService',
        payload: { auditId: record.id, action: entry.actionType },
      });
      return record;
    },

    async list(filters = {}, limit = 100) {
      return await base44.asServiceRole.entities.AuditLog.filter(filters, '-created_date', limit);
    },

    async getByUser(userId, limit = 50) {
      return await base44.asServiceRole.entities.AuditLog.filter({ target_user_id: userId }, '-created_date', limit);
    },
  };
}