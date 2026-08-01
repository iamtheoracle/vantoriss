const agents = new Map();

export const AIRegistry = {
  register(agent) { agents.set(agent.name, agent); },
  get(name) { return agents.get(name); },
  list() { return Array.from(agents.values()); },
  remove(name) { agents.delete(name); },
  getEnabled() { return Array.from(agents.values()).filter(a => a.enabled !== false); },
};