const eventTypes = new Map();

const categories = ['request', 'response', 'lifecycle', 'workflow', 'capability', 'audit', 'security', 'monitoring'];
for (const cat of categories) {
  eventTypes.set(cat, { name: cat, version: '1.0.0', description: `${cat} events` });
}

export const EventRegistry = {
  register(type) { eventTypes.set(type.name, type); },
  get(name) { return eventTypes.get(name); },
  list() { return Array.from(eventTypes.values()); },
  getCategories() { return categories; },
  isValid(name) { return eventTypes.has(name); },
};