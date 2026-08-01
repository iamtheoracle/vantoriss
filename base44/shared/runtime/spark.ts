import { eventBus } from './eventBus.ts';
import { logger } from './logger.ts';
import { CircuitBreaker, withRetry } from './circuitBreaker.ts';

export function createSpark() {
  const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 60000 });

  return {
    async reason(request, orchestration, services) {
      logger.debug('Spark reasoning', { requestId: request.id });

      const model = orchestration.model?.name || 'automatic';
      const promptTemplate = orchestration.prompt?.template || 'You are a helpful assistant.';

      // Build context from platform services (Spark does NOT own these)
      const memory = orchestration.context?.memory;
      const history = orchestration.context?.history || [];

      const systemPrompt = this._buildSystemPrompt(promptTemplate, memory, history);

      eventBus.publish({
        type: 'request', source: 'spark', target: 'modelService',
        payload: { requestId: request.id, model },
      });

      try {
        const result = await breaker.execute(() =>
          withRetry(() => services.model.invoke({
            prompt: `${systemPrompt}\n\nUser: ${request.message}`,
            model,
          }), { maxRetries: 2, backoffMs: 2000, timeout: 60000 })
        );

        eventBus.publish({
          type: 'response', source: 'spark', target: 'oracle',
          payload: { requestId: request.id, model },
        });

        return {
          content: typeof result === 'string' ? result : (result.response || result.result || JSON.stringify(result)),
          sources: orchestration.context?.knowledge || [],
          metadata: { model },
        };
      } catch (error) {
        logger.error('Spark reasoning failed', { requestId: request.id, error: error.message });
        return {
          content: 'I apologize, but I encountered an issue processing your request. Please try again.',
          metadata: { error: error.message, model },
        };
      }
    },

    _buildSystemPrompt(template, memory, history) {
      let prompt = template;
      if (memory) {
        prompt += `\n\nUser preferences: ${JSON.stringify(memory)}`;
      }
      if (history && history.length > 0) {
        const recent = history.slice(-5).map(h => `${h.sender}: ${h.body}`).join('\n');
        prompt += `\n\nRecent conversation:\n${recent}`;
      }
      return prompt;
    },
  };
}