const services = new Map();

export const ServiceRegistry = {
  register(service) { services.set(service.name, service); },
  get(name) { return services.get(name); },
  list() { return Array.from(services.values()); },
  getEnabled() { return Array.from(services.values()).filter(s => s.enabled !== false); },
  remove(name) { services.delete(name); },
};