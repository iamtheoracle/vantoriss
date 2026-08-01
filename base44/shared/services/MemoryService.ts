import { logger } from '../runtime/logger.ts';

export function createMemoryService(base44) {
  return {
    async store(userId, key, value, type = 'context', expiresAt) {
      logger.debug('MemoryService.store', { userId, key, type });
      return await base44.asServiceRole.entities.MemoryRecord.create({
        user_id: userId, key, value: JSON.stringify(value), type, expires_at: expiresAt,
      });
    },

    async retrieve(userId, key) {
      const records = await base44.asServiceRole.entities.MemoryRecord.filter({ user_id: userId, key });
      if (!records.length) return null;
      try { return JSON.parse(records[0].value); } catch { return records[0].value; }
    },

    async list(userId, type) {
      const query = { user_id: userId };
      if (type) query.type = type;
      return await base44.asServiceRole.entities.MemoryRecord.filter(query);
    },

    async delete(id) {
      return await base44.asServiceRole.entities.MemoryRecord.delete(id);
    },

    async clearExpired() {
      const now = new Date().toISOString();
      return await base44.asServiceRole.entities.MemoryRecord.filter({ expires_at: { $lt: now } });
    },
  };
}