const subscribers = new Map();
const eventHistory = [];
const MAX_HISTORY = 1000;

export const eventBus = {
  subscribe(eventType, handler) {
    if (!subscribers.has(eventType)) subscribers.set(eventType, []);
    subscribers.get(eventType).push(handler);
    return () => {
      const handlers = subscribers.get(eventType);
      const idx = handlers ? handlers.indexOf(handler) : -1;
      if (idx > -1) handlers.splice(idx, 1);
    };
  },

  publish(event) {
    const fullEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...event,
    };
    eventHistory.push(fullEvent);
    if (eventHistory.length > MAX_HISTORY) eventHistory.shift();
    const handlers = subscribers.get(fullEvent.type) || [];
    for (const handler of handlers) {
      try { handler(fullEvent); } catch (e) { console.error('Event handler error:', e); }
    }
    const wildcard = subscribers.get('*') || [];
    for (const handler of wildcard) {
      try { handler(fullEvent); } catch (e) { console.error('Wildcard handler error:', e); }
    }
    return fullEvent;
  },

  getHistory(type, limit = 100) {
    const filtered = type ? eventHistory.filter(e => e.type === type) : eventHistory;
    return filtered.slice(-limit);
  },

  clear() { eventHistory.length = 0; },
};