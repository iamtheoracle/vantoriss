const prompts = new Map();

prompts.set('default_assistant', { name: 'default_assistant', template: 'You are the Vantoris AI assistant, an elite enterprise co-pilot for wealth management.', version: '1.0.0' });
prompts.set('code_generation', { name: 'code_generation', template: 'You are an expert code generator.', version: '1.0.0' });
prompts.set('code_rewrite', { name: 'code_rewrite', template: 'You are an expert code refactoring assistant.', version: '1.0.0' });
prompts.set('financial_analysis', { name: 'financial_analysis', template: 'You are a financial analyst.', version: '1.0.0' });

export const PromptRegistry = {
  register(prompt) { prompts.set(prompt.name, prompt); },
  get(name) { return prompts.get(name); },
  list() { return Array.from(prompts.values()); },
  getDefault() { return prompts.get('default_assistant'); },
  resolve(name) { return prompts.get(name) || prompts.get('default_assistant'); },
};