import { eventBus } from './eventBus.ts';
import { logger, createTracer } from './logger.ts';

export function createVantorisIntelligence(services, registries, guardian, nexus, spark, orbit) {
  const pipeline = ['guardian', 'nexus', 'capabilities', 'services', 'spark', 'orbit'];

  return {
    async process(request) {
      const traceId = crypto.randomUUID();
      const tracer = createTracer(traceId);
      const span = tracer.startSpan('vantoris_intelligence.process');

      logger.info('Vantoris Intelligence processing request', { requestId: request.id, userId: request.userId, traceId });
      eventBus.publish({
        type: 'request', source: 'vantoris_intelligence', target: 'guardian',
        payload: { requestId: request.id }, correlationId: traceId,
      });

      try {
        // 1. Guardian — enforce governance (DENY by default)
        const authDecision = await guardian.authorize(request);
        if (authDecision.effect === 'deny') {
          eventBus.publish({
            type: 'security', source: 'guardian',
            payload: { requestId: request.id, decision: 'deny', reason: authDecision.reason },
            correlationId: traceId,
          });
          span.setAttribute('decision', 'denied');
          span.end();
          return {
            requestId: request.id,
            content: 'Access denied by Guardian policy.',
            metadata: { reason: authDecision.reason, traceId },
          };
        }

        // 2. Nexus — orchestrate capability resolution
        eventBus.publish({
          type: 'capability', source: 'vantoris_intelligence', target: 'nexus',
          payload: { requestId: request.id }, correlationId: traceId,
        });
        const orchestration = await nexus.orchestrate(request, services, registries);

        // 3. Spark — knowledge intelligence (reasoning)
        let response = orchestration;
        if (orchestration.requiresReasoning) {
          eventBus.publish({
            type: 'request', source: 'vantoris_intelligence', target: 'spark',
            payload: { requestId: request.id }, correlationId: traceId,
          });
          response = await spark.reason(request, orchestration, services);
        }

        // 3b. Persist recommendations for staff approval; never execute them here.
        if (response.recommendation) {
          eventBus.publish({
            type: 'workflow', source: 'vantoris_intelligence',
            payload: { requestId: request.id, specialist: orchestration.routing?.specialist, recommendationCreated: true },
            correlationId: traceId,
          });
        }

        // 4. Orbit — handle deferred work
        if (orchestration.deferredJobs && orchestration.deferredJobs.length) {
          for (const job of orchestration.deferredJobs) {
            await orbit.schedule(job);
          }
        }

        eventBus.publish({
          type: 'response', source: 'vantoris_intelligence', target: 'bud',
          payload: { requestId: request.id }, correlationId: traceId,
        });

        span.end();
        logger.info('Vantoris Intelligence completed request', { requestId: request.id, traceId });

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
        logger.error('Vantoris Intelligence pipeline error', { requestId: request.id, traceId, error: error.message });
        eventBus.publish({
          type: 'monitoring', source: 'vantoris_intelligence',
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
