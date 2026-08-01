import { eventBus } from '../runtime/eventBus.ts';
import { logger } from '../runtime/logger.ts';

const traces = new Map();
const MAX_TRACES = 500;

export function createTelemetryService(base44) {
  return {
    startTrace(name) {
      const traceId = crypto.randomUUID();
      const trace = { id: traceId, name, spans: [], startTime: Date.now() };
      traces.set(traceId, trace);
      if (traces.size > MAX_TRACES) {
        const oldest = traces.keys().next().value;
        traces.delete(oldest);
      }

      return {
        traceId,
        startSpan(spanName) {
          const spanId = crypto.randomUUID();
          const span = { id: spanId, traceId, name: spanName, startTime: Date.now() };
          trace.spans.push(span);
          return {
            spanId,
            end() {
              span.endTime = Date.now();
              span.duration = span.endTime - span.startTime;
            },
            setAttribute(key, value) { span[key] = value; },
          };
        },
        end() {
          trace.endTime = Date.now();
          trace.duration = trace.endTime - trace.startTime;
          eventBus.publish({
            type: 'monitoring', source: 'telemetry',
            payload: { traceId, name, duration: trace.duration, spans: trace.spans.length },
          });
        },
      };
    },

    getTrace(traceId) {
      return traces.get(traceId);
    },

    getAllTraces() {
      return Array.from(traces.values());
    },
  };
}