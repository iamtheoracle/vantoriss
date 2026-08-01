const sessions = new Map();
const SESSION_TTL_MS = 3600000; // 1 hour

export function createSessionService(base44) {
  return {
    create(userId) {
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, { userId, createdAt: Date.now(), data: {} });
      return sessionId;
    },

    get(sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return null;
      if (Date.now() - session.createdAt > SESSION_TTL_MS) {
        sessions.delete(sessionId);
        return null;
      }
      return session;
    },

    set(sessionId, key, value) {
      const session = sessions.get(sessionId);
      if (session) session.data[key] = value;
    },

    getAttribute(sessionId, key) {
      const session = this.get(sessionId);
      return session?.data?.[key];
    },

    delete(sessionId) {
      sessions.delete(sessionId);
    },

    isValid(sessionId) {
      return this.get(sessionId) !== null;
    },

    cleanup() {
      const now = Date.now();
      for (const [id, session] of sessions) {
        if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id);
      }
    },
  };
}