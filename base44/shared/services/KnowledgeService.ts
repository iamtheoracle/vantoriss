export function createKnowledgeService(base44) {
  return {
    async retrieve(query, options = {}) {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Retrieve structured knowledge about: ${query}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            facts: { type: 'array', items: { type: 'string' } },
            sources: { type: 'array', items: { type: 'string' } },
          },
          required: ['summary'],
        },
        model: options.model || 'gemini_3_flash',
      });
      return result;
    },

    async synthesize(topics) {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Synthesize the following topics into a coherent summary: ${topics.join(', ')}`,
        response_json_schema: {
          type: 'object',
          properties: {
            synthesis: { type: 'string' },
            keyPoints: { type: 'array', items: { type: 'string' } },
          },
          required: ['synthesis'],
        },
      });
      return result;
    },
  };
}