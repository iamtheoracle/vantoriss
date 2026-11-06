import { createModelGateway } from './ModelGateway.ts';

/**
 * AVA's provider-independent model service.
 * The AVU model gateway is preferred when configured; the retained InvokeLLM
 * integration remains available through an explicit compatibility method.
 */
export function createModelService(base44) {
  const gateway = createModelGateway(base44);
  return {
    async invoke(params) {
      return gateway.invoke(params || {});
    },

    async invokeLegacy(params) {
      return gateway.invokeLegacy(params || {});
    },

    providerStatus() {
      return gateway.status();
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
        { name: 'gateway_default', provider: 'institution_gateway', cost: 'configured' },
        { name: 'automatic', provider: 'classic_invoke_llm', cost: 'medium', compatibility: true },
        { name: 'gpt_5_mini', provider: 'classic_invoke_llm', cost: 'low', compatibility: true },
        { name: 'gemini_3_flash', provider: 'classic_invoke_llm', cost: 'low', compatibility: true },
        { name: 'claude_sonnet_4_6', provider: 'classic_invoke_llm', cost: 'high', compatibility: true },
        { name: 'claude_opus_4_6', provider: 'classic_invoke_llm', cost: 'critical', compatibility: true },
      ];
    },
  };
}
