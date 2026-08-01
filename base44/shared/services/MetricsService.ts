export function createMetricsService(base44) {
  return {
    async increment(name, value = 1, tags = {}) {
      return await base44.asServiceRole.entities.MetricRecord.create({
        name, value, type: 'counter', tags: JSON.stringify(tags),
      });
    },

    async gauge(name, value, tags = {}) {
      return await base44.asServiceRole.entities.MetricRecord.create({
        name, value, type: 'gauge', tags: JSON.stringify(tags),
      });
    },

    async timer(name, durationMs, tags = {}) {
      return await base44.asServiceRole.entities.MetricRecord.create({
        name, value: durationMs, type: 'timer', tags: JSON.stringify(tags),
      });
    },

    async list(name, limit = 100) {
      const query = {};
      if (name) query.name = name;
      return await base44.asServiceRole.entities.MetricRecord.filter(query, '-created_date', limit);
    },

    async summary(name) {
      const records = await base44.asServiceRole.entities.MetricRecord.filter({ name }, '-created_date', 500);
      if (!records.length) return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
      const values = records.map(r => r.value);
      return {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    },
  };
}