import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { resourceAttributes, unitRequest } from '../../shared/unit.ts';

async function verifySignature(rawBody: Uint8Array, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, rawBody);
  const expected = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return expected === signature;
}

function accountStatus(status: string) {
  if (status === 'Frozen') return 'frozen';
  if (status === 'Closed') return 'closed';
  return 'active';
}

async function syncAccount(base44: any, providerAccountId: string) {
  const localAccounts = await base44.asServiceRole.entities.Account.filter({ provider: 'unit', provider_account_id: providerAccountId }, '-created_date', 20);
  if (!localAccounts?.length) return;
  const response = await unitRequest(`/accounts/${encodeURIComponent(providerAccountId)}`);
  const resource = response?.data;
  const attrs = resourceAttributes(resource);
  for (const local of localAccounts) {
    await base44.asServiceRole.entities.Account.update(local.id, {
      balance: Number(attrs.balance || 0) / 100,
      available_balance: Number(attrs.available || 0) / 100,
      status: accountStatus(attrs.status || 'Open'),
      provider_status: attrs.status || 'Open',
      last_provider_sync_at: new Date().toISOString(),
    });
  }
}

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get('UNIT_WEBHOOK_SECRET') || '';
    const rawBody = new Uint8Array(await req.arrayBuffer());
    const signature = req.headers.get('x-unit-signature');
    if (!(await verifySignature(rawBody, signature, secret))) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = JSON.parse(new TextDecoder().decode(rawBody));
    const events = Array.isArray(payload?.data) ? payload.data : payload?.data ? [payload.data] : [];
    const base44 = createClientFromRequest(req);
    const processed = [];

    for (const event of events) {
      const eventId = String(event?.id || '');
      const eventType = String(event?.type || '');
      if (!eventId || !eventType) continue;

      const prior = await base44.asServiceRole.entities.ProviderEvent.filter({ provider: 'unit', event_id: eventId }, '-created_date', 1);
      if (prior?.length) continue;

      let status = 'ignored';
      const applicationId = event?.relationships?.application?.data?.id || event?.relationships?.individualApplication?.data?.id;
      const customerId = event?.relationships?.customer?.data?.id;
      const accountId = event?.relationships?.account?.data?.id;

      if (eventType === 'application.approved' && applicationId) {
        const apps = await base44.asServiceRole.entities.Application.filter({ provider: 'unit', provider_application_id: String(applicationId) }, '-created_date', 10);
        for (const app of apps || []) {
          await base44.asServiceRole.entities.Application.update(app.id, {
            provider_status: 'Approved',
            provider_customer_id: customerId || app.provider_customer_id || null,
            kyc_status: 'approved',
            application_status: 'approved',
          });
        }
        status = 'processed';
      } else if (eventType === 'application.denied' && applicationId) {
        const apps = await base44.asServiceRole.entities.Application.filter({ provider: 'unit', provider_application_id: String(applicationId) }, '-created_date', 10);
        for (const app of apps || []) {
          await base44.asServiceRole.entities.Application.update(app.id, { provider_status: 'Denied', kyc_status: 'rejected', application_status: 'rejected' });
        }
        status = 'processed';
      } else if (eventType === 'application.pendingReview' || eventType === 'application.awaitingDocuments' || eventType === 'application.created') {
        if (applicationId) {
          const apps = await base44.asServiceRole.entities.Application.filter({ provider: 'unit', provider_application_id: String(applicationId) }, '-created_date', 10);
          for (const app of apps || []) await base44.asServiceRole.entities.Application.update(app.id, { provider_status: eventType.split('.')[1] });
          status = 'processed';
        }
      } else if (eventType === 'customer.created' && applicationId) {
        const apps = await base44.asServiceRole.entities.Application.filter({ provider: 'unit', provider_application_id: String(applicationId) }, '-created_date', 10);
        for (const app of apps || []) await base44.asServiceRole.entities.Application.update(app.id, { provider_customer_id: customerId || app.provider_customer_id || null, provider_status: 'Approved', kyc_status: 'approved', application_status: 'approved' });
        status = 'processed';
      } else if (accountId && (eventType.startsWith('account.') || eventType.startsWith('transaction.'))) {
        await syncAccount(base44, String(accountId));
        status = 'processed';
      }

      await base44.asServiceRole.entities.ProviderEvent.create({
        provider: 'unit',
        event_id: eventId,
        event_type: eventType,
        resource_id: String(applicationId || customerId || accountId || ''),
        processed_at: new Date().toISOString(),
        status,
      });
      processed.push(eventId);
    }

    return Response.json({ success: true, processed: processed.length });
  } catch (error) {
    return Response.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
});
