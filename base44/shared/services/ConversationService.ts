import { logger } from '../runtime/logger.ts';

export function createConversationService(base44) {
  return {
    async getOrCreateThread(userId, subject) {
      const threads = await base44.asServiceRole.entities.MessageThread.filter({ user_id: userId, status: 'open' });
      if (threads.length) return threads[0];
      return await base44.asServiceRole.entities.MessageThread.create({
        user_id: userId, subject: subject || 'AI Conversation', status: 'open',
      });
    },

    async addMessage(threadId, userId, role, content) {
      const sender = role === 'user' ? 'member' : 'admin';
      const msg = await base44.asServiceRole.entities.ThreadMessage.create({
        thread_id: threadId, user_id: userId, sender, body: content,
      });
      await base44.asServiceRole.entities.MessageThread.update(threadId, {
        last_message: content.substring(0, 200),
        last_sender: sender,
        last_message_date: new Date().toISOString(),
        unread_by_member: role === 'admin',
        unread_by_admin: role === 'user',
      });
      return msg;
    },

    async getHistory(threadId, limit = 50) {
      const messages = await base44.asServiceRole.entities.ThreadMessage.filter({ thread_id: threadId });
      return messages.slice(0, limit);
    },

    async closeThread(threadId) {
      return await base44.asServiceRole.entities.MessageThread.update(threadId, { status: 'closed' });
    },
  };
}