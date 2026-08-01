export function createSearchService(base44) {
  return {
    async search(query, options = {}) {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Search for: ${query}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  url: { type: 'string' },
                  snippet: { type: 'string' },
                },
              },
            },
          },
          required: ['results'],
        },
        model: options.model || 'gemini_3_flash',
      });
      return result;
    },
  };
}