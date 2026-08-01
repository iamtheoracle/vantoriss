import { logger } from './logger.ts';
import { eventBus } from './eventBus.ts';
import { createMemoryService } from '../services/MemoryService.ts';
import { createConversationService } from '../services/ConversationService.ts';
import { createKnowledgeService } from '../services/KnowledgeService.ts';
import { createSearchService } from '../services/SearchService.ts';
import { createPromptService } from '../services/PromptService.ts';
import { createModelService } from '../services/ModelService.ts';
import { createAuditService } from '../services/AuditService.ts';
import { createNotificationService } from '../services/NotificationService.ts';
import { createIdentityService } from '../services/IdentityService.ts';
import { createSessionService } from '../services/SessionService.ts';
import { createConfigurationService } from '../services/ConfigurationService.ts';
import { createMetricsService } from '../services/MetricsService.ts';
import { createTelemetryService } from '../services/TelemetryService.ts';
import { createHealthService } from '../services/HealthService.ts';
import { AIRegistry } from '../registries/AIRegistry.ts';
import { CapabilityRegistry } from '../registries/CapabilityRegistry.ts';
import { PromptRegistry } from '../registries/PromptRegistry.ts';
import { ModelRegistry } from '../registries/ModelRegistry.ts';
import { ToolRegistry } from '../registries/ToolRegistry.ts';
import { WorkflowRegistry } from '../registries/WorkflowRegistry.ts';
import { PolicyRegistry } from '../registries/PolicyRegistry.ts';
import { EventRegistry } from '../registries/EventRegistry.ts';
import { ServiceRegistry } from '../registries/ServiceRegistry.ts';
import { createGuardian } from './guardian.ts';
import { createNexus } from './nexus.ts';
import { createSpark } from './spark.ts';
import { createOrbit } from './orbit.ts';
import { createOracle } from './oracle.ts';

let cachedRuntime = null;

export async function boot(base44) {
  if (cachedRuntime) return cachedRuntime;

  const stages = [];
  const registries = {};
  const services = {};
  const runtime = {};

  // Stage 1: BootLoader
  await runStage(stages, 'BootLoader', async () => {
    logger.info('BootLoader initializing');
  });

  // Stage 2: Kernel Boot
  await runStage(stages, 'KernelBoot', async () => {
    logger.info('Kernel booting');
  });

  // Stage 3: Registry Boot
  await runStage(stages, 'RegistryBoot', async () => {
    registries.ai = AIRegistry;
    registries.capability = CapabilityRegistry;
    registries.prompt = PromptRegistry;
    registries.model = ModelRegistry;
    registries.tool = ToolRegistry;
    registries.workflow = WorkflowRegistry;
    registries.policy = PolicyRegistry;
    registries.event = EventRegistry;
    registries.service = ServiceRegistry;
    logger.info('Registries initialized', { count: Object.keys(registries).length });
  });

  // Stage 4: Platform Services Boot
  await runStage(stages, 'PlatformServicesBoot', async () => {
    services.memory = createMemoryService(base44);
    services.conversation = createConversationService(base44);
    services.knowledge = createKnowledgeService(base44);
    services.search = createSearchService(base44);
    services.prompt = createPromptService(base44);
    services.model = createModelService(base44);
    services.audit = createAuditService(base44);
    services.notification = createNotificationService(base44);
    services.identity = createIdentityService(base44);
    services.session = createSessionService(base44);
    services.configuration = createConfigurationService(base44);
    services.metrics = createMetricsService(base44);
    services.telemetry = createTelemetryService(base44);
    services.health = createHealthService(base44);
    logger.info('Platform services initialized', { count: Object.keys(services).length });
  });

  // Stage 5: AI Runtime Boot
  await runStage(stages, 'AIRuntimeBoot', async () => {
    runtime.guardian = createGuardian(registries);
    runtime.nexus = createNexus();
    runtime.spark = createSpark();
    runtime.orbit = createOrbit(base44);
    runtime.oracle = createOracle(services, registries, runtime.guardian, runtime.nexus, runtime.spark, runtime.orbit);
    logger.info('AI runtime initialized');
  });

  // Stage 6: Application Boot
  await runStage(stages, 'ApplicationBoot', async () => {
    for (const [name] of Object.entries(services)) {
      registries.service.register({ name, enabled: true });
    }
  });

  // Stage 7: Health Checks
  await runStage(stages, 'HealthChecks', async () => {
    services.health.register('database', async () => {
      try {
        await base44.asServiceRole.entities.MemoryRecord.list(1);
        return { service: 'database', status: 'healthy' };
      } catch (e) {
        return { service: 'database', status: 'unhealthy', details: { error: e.message } };
      }
    });
    services.health.register('llm', async () => {
      return { service: 'llm', status: 'healthy' };
    });
  });

  eventBus.publish({
    type: 'lifecycle', source: 'bootLoader',
    payload: { status: 'ready', stages: stages.length },
  });

  cachedRuntime = { services, registries, runtime, stages };
  return cachedRuntime;
}

async function runStage(stages, name, fn) {
  const stage = { name, status: 'running', startedAt: new Date().toISOString() };
  try {
    await fn();
    stage.status = 'completed';
    stage.completedAt = new Date().toISOString();
    logger.info(`Boot stage completed: ${name}`);
  } catch (error) {
    stage.status = 'failed';
    stage.error = error.message;
    stages.push(stage);
    logger.error(`Boot stage failed: ${name}`, { error: error.message });
    throw error;
  }
  stages.push(stage);
}