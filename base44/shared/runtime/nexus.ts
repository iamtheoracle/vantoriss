import { eventBus } from './eventBus.ts';
import { logger } from './logger.ts';

export function createNexus() {
  return {
    async orchestrate(request, services, registries) {
      logger.debug('Nexus orchestrating', { requestId: request.id });

      // Resolve capabilities from the Capability Registry (authoritative)
      const requestedCaps = request.capabilities || ['reasoning', 'knowledge'];
      const capabilities = registries.capability.resolve(requestedCaps);

      // Determine if reasoning is needed
      const requiresReasoning = capabilities.some(c => c.type === 'reasoning' || c.type === 'knowledge');

      // Resolve model from Model Registry
      const model = registries.model.select(request.priority || 'normal');

      // Resolve prompt from Prompt Registry
      const prompt = registries.prompt.resolve('default_assistant');

      // Build context from platform services
      const memory = await services.memory.retrieve(request.userId, 'preferences');
      const conversation = await services.conversation.getOrCreateThread(request.userId, 'AI Assistant');
      const history = await services.conversation.getHistory(conversation.id, 10);

      eventBus.publish({
        type: 'workflow', source: 'nexus',
        payload: {
          requestId: request.id,
          capabilities: capabilities.map(c => c.name),
          model: model?.name,
          requiresReasoning,
        },
      });

      return {
        capabilities,
        requiresReasoning,
        model,
        prompt,
        context: { memory, conversation, history },
        deferredJobs: [],
      };
    },
  };
}