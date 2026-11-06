import { eventBus } from './eventBus.ts';
import { logger, createTracer } from './logger.ts';

export function createCore(services, registries, trust, command, intelligence, scheduler) {
  const pipeline = ['trust', 'command', 'capabilities', 'services', 'intelligence', 'scheduler'];

  return {
    async process(request) {
      const traceId = crypto.randomUUID();
      const tracer = createTracer(traceId);
      const span = tracer.startSpan('core.process');

      logger.info('AVCU Core processing request', { requestId: request.id, userId: request.userId, traceId });
      eventBus.publish({
        type: 'request', source: 'core', target: 'trust',
        payload: { requestId: request.id }, correlationId: traceId,
      });

      try {
        // 1. Trust — enforce governance (DENY by default)
        const authDecision = await trust.authorize(request);
        if (authDecision.effect === 'deny') {
          eventBus.publish({
            type: 'security', source: 'trust',
            payload: { requestId: request.id, decision: 'deny', reason: authDecision.reason },
            correlationId: traceId,
          });
          span.setAttribute('decision', 'denied');
          span.end();
          return {
            requestId: request.id,
            content: 'Access denied by Trust policy.',
            metadata: { reason: authDecision.reason, traceId },
          };
        }

        // 2. Command — orchestrate capability resolution
        eventBus.publish({
          type: 'capability', source: 'core', target: 'command',
          payload: { requestId: request.id }, correlationId: traceId,
        });
        const orchestration = await command.orchestrate(request, services, registries);

        // 3. Intelligence — knowledge intelligence (reasoning)
        let response = orchestration;
        if (orchestration.requiresReasoning) {
          eventBus.publish({
            type: 'request', source: 'core', target: 'intelligence',
            payload: { requestId: request.id }, correlationId: traceId,
          });
          response = await intelligence.reason(request, orchestration, services);
        }

        // 3b. If Intelligence produced a structured recommendation, persist it for staff approval
        if (response.recommendation) {
          eventBus.publish({
            type: 'workflow', source: 'core',
            payload: { requestId: request.id, specialist: orchestration.routing?.specialist, recommendationCreated: true },
            correlationId: traceId,
          });
        }

        // 4. Scheduler — handle deferred work
        if (orchestration.deferredJobs && orchestration.deferredJobs.length) {
          for (const job of orchestration.deferredJobs) {
            await scheduler.schedule(job);
          }
        }

        eventBus.publish({
          type: 'response', source: 'core', target: 'ava',
          payload: { requestId: request.id }, correlationId: traceId,
        });

        span.end();
        logger.info('AVCU Core completed request', { requestId: request.id, traceId });

        return {
          requestId: request.id,
          content: response.content,
          sources: response.sources,
          capabilities: orchestration.capabilities?.map(c => c.name),
          routing: orchestration.routing,
          recommendation: response.recommendation || null,
          escalate: orchestration.escalate || false,
          metadata: { traceId, ...response.metadata },
        };
      } catch (error) {
        span.setAttribute('error', error.message);
        span.end();
        logger.error('AVCU Core pipeline error', { requestId: request.id, traceId, error: error.message });
        eventBus.publish({
          type: 'monitoring', source: 'core',
          payload: { error: error.message, requestId: request.id }, correlationId: traceId,
        });
        throw error;
      }
    },

    getPipeline() { return pipeline; },
    getServices() { return services; },
    getRegistries() { return registries; },
  };
}

// Deprecated compatibility export for existing integrations.
export const createOracle = createCore;
