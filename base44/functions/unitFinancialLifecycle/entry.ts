import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { extractResource, resourceAttributes, unitRequest } from '../../shared/unit.ts';

function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json({ success: false, error: message, details }, { status });
}

function idempotencyKey(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function isStaff(user: any) {
  return ['super_administrator', 'admin', 'operations_officer'].includes(user?.role);
}

function assertTargetAccess(user: any, targetUserId: string) {
  if (!targetUserId || (targetUserId !== user.id && !isStaff(user))) {
    const error = new Error('You are not authorized to act for this user.');
    error.status = 403;
    throw error;
  }
}

async function linkedAccount(base44: any, userId: string, providerAccountId: string) {
  const rows = await base44.asServiceRole.entities.Account.filter({ user_id: userId, provider: 'unit', provider_account_id: providerAccountId }, '-created_date', 5);
  if (!rows?.length) {
    const error = new Error('Provider account is not linked to this Vantoris user.');
    error.status = 404;
    throw error;
  }
  return rows[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id) return jsonError('Unauthorized', 401);
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const targetUserId = String(body.user_id || user.id);
    assertTargetAccess(user, targetUserId);

    if (action === 'book_transfer') {
      const providerAccountId = String(body.provider_account_id || '');
      const counterpartyAccountId = String(body.counterparty_account_id || '');
      const amountCents = Number(body.amount_cents);
      if (!providerAccountId || !counterpartyAccountId || !Number.isInteger(amountCents) || amountCents <= 0) return jsonError('provider_account_id, counterparty_account_id and a positive integer amount_cents are required');
      await linkedAccount(base44, targetUserId, providerAccountId);
      const recipient = await base44.asServiceRole.entities.Account.filter({ provider: 'unit', provider_account_id: counterpartyAccountId }, '-created_date', 5);
      if (!recipient?.length) return jsonError('Recipient provider account is not a Vantoris-linked account.', 404);
      const requestBody = {
        data: {
          type: 'bookPayment',
          attributes: { amount: amountCents, direction: 'Credit', description: String(body.description || 'VANTORIS').slice(0, 80), idempotencyKey: idempotencyKey(`vantoris-book-${providerAccountId}`) },
          relationships: {
            account: { data: { type: 'depositAccount', id: providerAccountId } },
            counterpartyAccount: { data: { type: 'depositAccount', id: counterpartyAccountId } },
          },
        },
      };
      const response = await unitRequest('/payments', { method: 'POST', body: requestBody, idempotencyKey: requestBody.data.attributes.idempotencyKey });
      const resource = extractResource(response);
      const attrs = resourceAttributes(resource);
      return Response.json({ success: true, provider: 'unit', payment_id: resource?.id, status: attrs.status, amount_cents: attrs.amount, direction: attrs.direction });
    }

    if (action === 'simulate_receive_ach') {
      if (!String(Deno.env.get('UNIT_API_BASE_URL') || '').includes('unit.sh')) return jsonError('Sandbox receive simulation is unavailable on the live Unit endpoint.', 409);
      const providerAccountId = String(body.provider_account_id || '');
      const amountCents = Number(body.amount_cents);
      if (!providerAccountId || !Number.isInteger(amountCents) || amountCents <= 0) return jsonError('provider_account_id and a positive integer amount_cents are required');
      await linkedAccount(base44, targetUserId, providerAccountId);
      const requestBody = { data: { type: 'achPayment', attributes: { amount: amountCents, direction: 'Credit', description: String(body.description || 'Sandbox receive').slice(0, 50) }, relationships: { account: { data: { type: 'depositAccount', id: providerAccountId } } } } };
      const response = await unitRequest('/sandbox/payments', { method: 'POST', body: requestBody });
      return Response.json({ success: true, provider: 'unit', mode: 'SANDBOX', simulation: 'receive_ach', payment: extractResource(response) });
    }

    if (action === 'create_account_hold') {
      const providerAccountId = String(body.provider_account_id || '');
      const amountCents = Number(body.amount_cents);
      if (!providerAccountId || !Number.isInteger(amountCents) || amountCents <= 0) return jsonError('provider_account_id and a positive integer amount_cents are required');
      const account = await linkedAccount(base44, targetUserId, providerAccountId);
      const requestBody = { data: { type: 'accountHold', attributes: { amount: amountCents, description: String(body.description || 'Vantoris account hold').slice(0, 80), expiredAt: body.expired_at || undefined, idempotencyKey: idempotencyKey(`vantoris-hold-${providerAccountId}`) }, relationships: { account: { data: { type: 'depositAccount', id: providerAccountId } } } } };
      const response = await unitRequest('/account-holds', { method: 'POST', body: requestBody, idempotencyKey: requestBody.data.attributes.idempotencyKey });
      const resource = extractResource(response); const attrs = resourceAttributes(resource);
      const hold = await base44.asServiceRole.entities.AccountHold.create({ user_id: targetUserId, account_id: account.id, provider_account_id: providerAccountId, provider_hold_id: resource?.id, amount: amountCents / 100, remaining_amount: amountCents / 100, currency: 'USD', description: attrs.description || requestBody.data.attributes.description, status: 'active', created_at: attrs.createdAt || new Date().toISOString() });
      return Response.json({ success: true, provider: 'unit', hold: resource, local_hold_id: hold.id });
    }

    if (action === 'release_account_hold') {
      const holdId = String(body.hold_id || '');
      if (!holdId) return jsonError('hold_id is required');
      const localRows = await base44.asServiceRole.entities.AccountHold.filter({ user_id: targetUserId, provider_hold_id: holdId }, '-created_date', 5);
      if (!localRows?.length) return jsonError('Hold is not linked to this Vantoris user.', 404);
      const amountCents = body.amount_cents == null ? null : Number(body.amount_cents);
      const requestBody = amountCents == null ? undefined : { data: { type: 'accountHold', attributes: { amount: amountCents, idempotencyKey: idempotencyKey(`vantoris-hold-release-${holdId}`) } } };
      const response = await unitRequest(`/account-holds/${encodeURIComponent(holdId)}/release`, { method: 'POST', body: requestBody, idempotencyKey: amountCents == null ? undefined : requestBody.data.attributes.idempotencyKey });
      const resource = extractResource(response); const attrs = resourceAttributes(resource);
      await base44.asServiceRole.entities.AccountHold.update(localRows[0].id, { status: attrs.status === 'PartiallyReleased' ? 'partially_released' : 'released', remaining_amount: Number(attrs.remainingHoldAmount ?? 0) / 100, released_at: attrs.releasedAt || new Date().toISOString() });
      return Response.json({ success: true, provider: 'unit', hold: resource });
    }

    if (action === 'list_account_holds') {
      const providerAccountId = String(body.provider_account_id || '');
      if (!providerAccountId) return jsonError('provider_account_id is required');
      await linkedAccount(base44, targetUserId, providerAccountId);
      const response = await unitRequest(`/account-holds?page[limit]=100&filter[accountId]=${encodeURIComponent(providerAccountId)}`);
      return Response.json({ success: true, provider: 'unit', holds: response?.data || [] });
    }

    if (action === 'list_transactions') {
      const providerAccountId = String(body.provider_account_id || '');
      if (!providerAccountId) return jsonError('provider_account_id is required');
      await linkedAccount(base44, targetUserId, providerAccountId);
      const response = await unitRequest(`/transactions?filter[accountId]=${encodeURIComponent(providerAccountId)}&page[limit]=100`);
      return Response.json({ success: true, provider: 'unit', transactions: response?.data || [] });
    }

    if (action === 'simulate_dispute') {
      if (!String(Deno.env.get('UNIT_API_BASE_URL') || '').includes('unit.sh')) return jsonError('Sandbox dispute simulation is unavailable on the live Unit endpoint.', 409);
      const providerAccountId = String(body.provider_account_id || '');
      const transactionId = String(body.provider_transaction_id || '');
      const amountCents = Number(body.amount_cents);
      if (!providerAccountId || !transactionId || !Number.isInteger(amountCents) || amountCents <= 0) return jsonError('provider_account_id, provider_transaction_id and a positive integer amount_cents are required');
      const account = await linkedAccount(base44, targetUserId, providerAccountId);
      const requestBody = { data: { type: 'dispute', attributes: { amount: amountCents }, relationships: { account: { data: { type: 'depositAccount', id: providerAccountId } }, transaction: { data: { type: 'transaction', id: transactionId } } } } };
      const response = await unitRequest('/sandbox/disputes', { method: 'POST', body: requestBody });
      const resource = extractResource(response); const attrs = resourceAttributes(resource);
      const dispute = await base44.asServiceRole.entities.DisputeCase.create({ user_id: targetUserId, account_id: account.id, provider_account_id: providerAccountId, provider_dispute_id: resource?.id, provider_transaction_id: transactionId, amount: amountCents / 100, reason: body.reason || 'Other', description: body.description || '', status: attrs.status === 'InvestigationStarted' ? 'investigation_started' : 'submitted', created_at: attrs.createdAt || new Date().toISOString(), updated_at: new Date().toISOString() });
      return Response.json({ success: true, provider: 'unit', mode: 'SANDBOX', dispute: resource, local_dispute_id: dispute.id });
    }

    if (action === 'generate_statement') {
      const providerAccountId = String(body.provider_account_id || '');
      if (!providerAccountId) return jsonError('provider_account_id is required');
      const account = await linkedAccount(base44, targetUserId, providerAccountId);
      const isSandbox = String(Deno.env.get('UNIT_API_BASE_URL') || '').includes('unit.sh');
      if (!isSandbox) return jsonError('Statement generation is provider-controlled. Use the Unit statement resource for the live account.', 409);
      const response = await unitRequest(`/sandbox/accounts/${encodeURIComponent(providerAccountId)}/generate-statement`, { method: 'POST' });
      return Response.json({ success: true, provider: 'unit', mode: 'SANDBOX', account_id: account.id, statement: extractResource(response) });
    }

    return jsonError('Unsupported financial lifecycle action', 400);
  } catch (error) {
    const status = Number(error?.status || 500); const safeStatus = status >= 400 && status < 600 ? status : 500;
    return jsonError(error?.message || 'Provider financial lifecycle request failed', safeStatus);
  }
});
