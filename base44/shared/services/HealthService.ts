import { eventBus } from '../runtime/eventBus.ts';
import { logger } from '../runtime/logger.ts';

export function createHealthService(base44) {
  const checks = new Map();

  return {
    register(name, checkFn) {
      checks.set(name, checkFn);
    },

    async runCheck(name) {
      const fn = checks.get(name);
      if (!fn) return { service: name, status: 'unhealthy', details: { error: 'No check registered' } };
      try {
        const result = await fn();
        await base44.asServiceRole.entities.HealthCheck.create({
          service: name,
          status: result.status,
          details: JSON.stringify(result.details || {}),
        });
        return result;
      } catch (error) {
        logger.error(`Health check failed: ${name}`, { error: error.message });
        return { service: name, status: 'unhealthy', details: { error: error.message } };
      }
    },

    async runAll() {
      const results = [];
      for (const name of checks.keys()) {
        results.push(await this.runCheck(name));
      }
      eventBus.publish({
        type: 'monitoring', source: 'healthService',
        payload: { checks: results.length, healthy: results.filter(r => r.status === 'healthy').length },
      });
      return results;
    },

    async getHistory(service, limit = 50) {
      const query = {};
      if (service) query.service = service;
      return await base44.asServiceRole.entities.HealthCheck.filter(query, '-created_date', limit);
    },
  };
}