const cache = new Map();

export function createConfigurationService(base44) {
  return {
    async get(key) {
      if (cache.has(key)) return cache.get(key);
      const configs = await base44.asServiceRole.entities.AppConfiguration.filter({ key });
      const value = configs[0]?.value || null;
      cache.set(key, value);
      return value;
    },

    async set(key, value, category = 'general', label) {
      const existing = await base44.asServiceRole.entities.AppConfiguration.filter({ key });
      if (existing.length) {
        const updated = await base44.asServiceRole.entities.AppConfiguration.update(existing[0].id, { value, category, label });
        cache.set(key, value);
        return updated;
      }
      const created = await base44.asServiceRole.entities.AppConfiguration.create({ key, value, category, label });
      cache.set(key, value);
      return created;
    },

    async list(category) {
      const query = {};
      if (category) query.category = category;
      return await base44.asServiceRole.entities.AppConfiguration.filter(query);
    },

    clearCache() { cache.clear(); },
  };
}