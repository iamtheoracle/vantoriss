import { eventBus } from './eventBus.ts';
import { logger } from './logger.ts';
import { routeSpecialist, getSpecialistPrompt, getRequiredApprover, shouldEscalate } from './specialists.ts';

export function createNexus() {
  return {
    async orchestrate(request, services, registries) {
      logger.debug('Nexus orchestrating', { requestId: request.id });

      // === Specialist Routing ===
      // The unified assistant transparently routes to the appropriate specialist.
      // The member never chooses which assistant to use.
      const routing = routeSpecialist(request.message);
      logger.info('Nexus routed to specialist', {
        requestId: request.id,
        specialist: routing.specialist,
        confidence: routing.confidence,
        collaborators: routing.collaborators,
      });

      // Resolve capabilities from the Capability Registry (authoritative)
      const requestedCaps = request.capabilities || ['reasoning', 'knowledge'];
      const capabilities = registries.capability.resolve(requestedCaps);

      // Determine if reasoning is needed
      const requiresReasoning = capabilities.some(c => c.type === 'reasoning' || c.type === 'knowledge');

      // Resolve model from Model Registry
      const model = registries.model.select(request.priority || 'normal');

      // Resolve prompt from Prompt Registry — unified assistant identity
      const prompt = registries.prompt.resolve('default_assistant');

      // Build specialist-specific prompt context
      const specialistPrompt = getSpecialistPrompt(routing.specialist);
      const fullPrompt = {
        ...prompt,
        template: `${prompt.template}\n\n## Active Specialist\n${specialistPrompt}`,
      };

      // Build context from platform services
      const memory = await services.memory.retrieve(request.userId, 'preferences');
      const conversation = await services.conversation.getOrCreateThread(request.userId, 'AI Assistant');
      const history = await services.conversation.getHistory(conversation.id, 10);

      // Determine escalation
      const hasConflictingEvidence = routing.collaborators.length > 1;
      const escalate = shouldEscalate(routing, hasConflictingEvidence);

      eventBus.publish({
        type: 'workflow', source: 'nexus',
        payload: {
          requestId: request.id,
          specialist: routing.specialist,
          specialists: [routing.specialist, ...routing.collaborators],
          capabilities: capabilities.map(c => c.name),
          model: model?.name,
          requiresReasoning,
          confidence: routing.confidence,
          isActionImpacting: routing.isActionImpacting,
          escalate,
        },
      });

      return {
        capabilities,
        requiresReasoning,
        model,
        prompt: fullPrompt,
        context: { memory, conversation, history },
        routing,
        escalate,
        requiredApprover: getRequiredApprover(routing.specialist),
        deferredJobs: [],
      };
    },
  };
}