const templates = new Map();

templates.set('default_assistant', {
  name: 'default_assistant',
  template: 'You are the Vantoris AI assistant, an elite enterprise co-pilot for wealth management. Provide clear, professional, and actionable guidance.',
  version: '1.0.0',
});

templates.set('code_generation', {
  name: 'code_generation',
  template: 'You are an expert software engineer. Generate production-ready code following clean code principles.',
  version: '1.0.0',
});

templates.set('code_rewrite', {
  name: 'code_rewrite',
  template: 'You are an expert code refactoring assistant. Rewrite the provided code according to instructions.',
  version: '1.0.0',
});

templates.set('financial_analysis', {
  name: 'financial_analysis',
  template: 'You are a financial analyst. Provide structured analysis of the given financial data.',
  version: '1.0.0',
});

export function createPromptService(base44) {
  return {
    get(name) { return templates.get(name); },
    set(name, template) { templates.set(name, template); },
    list() { return Array.from(templates.values()); },
    getDefault() { return templates.get('default_assistant'); },

    async resolve(name, variables = {}) {
      let template = (templates.get(name)?.template) || (templates.get('default_assistant')?.template) || '';
      for (const [key, value] of Object.entries(variables)) {
        template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      }
      return template;
    },
  };
}