export function createNotificationService(base44) {
  return {
    async notify(userId, title, message, type = 'info', link) {
      return await base44.asServiceRole.entities.Notification.create({
        user_id: userId, title, message, type, link,
      });
    },

    async sendEmail(to, subject, body, fromName) {
      return await base44.asServiceRole.integrations.Core.SendEmail({
        to, subject, body, from_name: fromName,
      });
    },

    async list(userId, unreadOnly = false) {
      const query = { user_id: userId };
      if (unreadOnly) query.read = false;
      return await base44.asServiceRole.entities.Notification.filter(query, '-created_date', 50);
    },

    async markRead(id) {
      return await base44.asServiceRole.entities.Notification.update(id, { read: true });
    },

    async markAllRead(userId) {
      const unread = await base44.asServiceRole.entities.Notification.filter({ user_id: userId, read: false });
      for (const n of unread) {
        await base44.asServiceRole.entities.Notification.update(n.id, { read: true });
      }
    },
  };
}