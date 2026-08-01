const tools = new Map();

export const ToolRegistry = {
  register(tool) { tools.set(tool.name, tool); },
  get(name) { return tools.get(name); },
  list() { return Array.from(tools.values()); },
  resolve(names) { return names.map(n => tools.get(n)).filter(Boolean); },
  remove(name) { tools.delete(name); },
  getEnabled() { return Array.from(tools.values()).filter(t => t.enabled !== false); },
};