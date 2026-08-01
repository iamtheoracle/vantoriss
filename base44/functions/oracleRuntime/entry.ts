import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { boot } from '../../shared/runtime/bootLoader.ts';
import { logger } from '../../shared/runtime/logger.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { message, context, action = 'process' } = body;

    // Boot the runtime (cached after first call)
    const { services, runtime, stages: bootStages } = await boot(base44);

    // Health check endpoint
    if (action === 'health') {
      const health = await services.health.runAll();
      return Response.json({ status: 'ok', health, stages: bootStages || [] });
    }

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build the AI request through the Oracle pipeline:
    // User → Bud → Oracle → Guardian → Nexus → Capability Registry → Platform Services / Spark / Orbit → Oracle → Bud
    const request = {
      id: crypto.randomUUID(),
      userId: user.id,
      message,
      context: {
        userId: user.id,
        sessionId: context?.sessionId || crypto.randomUUID(),
        userRole: user.role,
        timestamp: new Date().toISOString(),
        source: 'bud',
      },
      capabilities: context?.capabilities || ['reasoning', 'knowledge'],
      priority: context?.priority || 'normal',
    };

    const response = await runtime.oracle.process(request);

    // Persist conversation via ConversationService (not owned by Bud)
    const thread = await services.conversation.getOrCreateThread(user.id, 'AI Assistant');
    await services.conversation.addMessage(thread.id, user.id, 'user', message);
    await services.conversation.addMessage(thread.id, user.id, 'assistant', response.content);

    // Record metrics via MetricsService
    await services.metrics.increment('ai_requests', 1, { userId: user.id });

    return Response.json({
      response: response.content,
      requestId: response.requestId,
      metadata: response.metadata,
      sources: response.sources,
      capabilities: response.capabilities,
    });
  } catch (error) {
    logger.error('Oracle runtime error', { error: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}