export function createModelService(base44) {
  return {
    async invoke({ prompt, model = 'automatic', responseJsonSchema, addContextFromInternet, fileUrls }) {
      const params = { prompt, model };
      if (responseJsonSchema) params.response_json_schema = responseJsonSchema;
      if (addContextFromInternet) params.add_context_from_internet = true;
      if (fileUrls) params.file_urls = fileUrls;
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM(params);
      return result.response || result.result || result;
    },

    select(priority = 'normal') {
      const models = {
        low: { name: 'gpt_5_mini', cost: 'low', description: 'Fast, cost-effective' },
        normal: { name: 'automatic', cost: 'medium', description: 'Automatic model selection' },
        high: { name: 'claude_sonnet_4_6', cost: 'high', description: 'High quality reasoning' },
        critical: { name: 'claude_opus_4_6', cost: 'critical', description: 'Highest quality' },
      };
      return models[priority] || models.normal;
    },

    list() {
      return [
        { name: 'automatic', cost: 'medium' },
        { name: 'gpt_5_mini', cost: 'low' },
        { name: 'gemini_3_flash', cost: 'low' },
        { name: 'claude_sonnet_4_6', cost: 'high' },
        { name: 'claude_opus_4_6', cost: 'critical' },
      ];
    },
  };
}