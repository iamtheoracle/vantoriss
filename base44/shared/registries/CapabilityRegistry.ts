const capabilities = new Map();

capabilities.set('reasoning', { name: 'reasoning', type: 'reasoning', handler: 'spark.reason', version: '1.0.0', enabled: true, permissions: [], description: 'LLM reasoning and synthesis' });
capabilities.set('knowledge', { name: 'knowledge', type: 'knowledge', handler: 'knowledge.retrieve', version: '1.0.0', enabled: true, permissions: [], description: 'Knowledge retrieval' });
capabilities.set('search', { name: 'search', type: 'knowledge', handler: 'search.search', version: '1.0.0', enabled: true, permissions: [], description: 'Web search' });
capabilities.set('memory', { name: 'memory', type: 'tool', handler: 'memory.store', version: '1.0.0', enabled: true, permissions: [], description: 'Memory storage and retrieval' });
capabilities.set('conversation', { name: 'conversation', type: 'tool', handler: 'conversation.addMessage', version: '1.0.0', enabled: true, permissions: [], description: 'Conversation history management' });
capabilities.set('audit', { name: 'audit', type: 'action', handler: 'audit.log', version: '1.0.0', enabled: true, permissions: ['admin'], description: 'Audit logging' });

export const CapabilityRegistry = {
  register(cap) { capabilities.set(cap.name, cap); },
  get(name) { return capabilities.get(name); },
  list() { return Array.from(capabilities.values()); },
  resolve(names) { return names.map(n => capabilities.get(n)).filter(Boolean); },
  getEnabled() { return Array.from(capabilities.values()).filter(c => c.enabled); },
  getByType(type) { return Array.from(capabilities.values()).filter(c => c.type === type); },
};