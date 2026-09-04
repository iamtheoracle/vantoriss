import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return jsonError('Unauthorized', 401);

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'create_application') {
      const targetUserId = body.user_id || user.id;
      assertTargetAccess(user, targetUserId);
      if (targetUserId !== user.id && !isStaff(user)) return jsonError('Unauthorized', 403);

      const existing = await base44.asServiceRole.entities.Application.filter({ user_id: targetUserId }, '-created_date', 10);
      const existingProvider = (existing || []).find((item: any) => item.provider === 'unit' && item.provider_application_id);
      if (existingProvider) {
        return Response.json({
          success: true,
          provider: 'unit',
          application_id: existingProvider.provider_application_id,
          customer_id: existingProvider.provider_customer_id || null,
          status: existingProvider.provider_status || 'unknown',
          reused: true,
        });
      }

      const required = ['full_name', 'email', 'date_of_birth', 'ssn', 'address', 'occupation'];
      for (const field of required) {
        if (!body[field]) return jsonError(`${field} is required for live banking onboarding`, 400);
      }

      const applicationPayload = {
        data: {
          type: 'individualApplication',
          attributes: {
            ssn: String(body.ssn),
            fullName: body.full_name,
            dateOfBirth: body.date_of_birth,
            address: body.address,
            email: body.email,
            phone: body.phone || undefined,
            occupation: body.occupation,
            annualIncome: body.annual_income || undefined,
            sourceOfIncome: body.source_of_income || undefined,
            ip: body.ip || undefined,
            idempotencyKey: idempotencyKey(`vantoris-application-${targetUserId}`),
          },
        },
      };

      const response = await unitRequest('/applications', {
        method: 'POST',
        body: applicationPayload,
        idempotencyKey: applicationPayload.data.attributes.idempotencyKey,
      });
      const resource = extractResource(response);
      const attrs = resourceAttributes(resource);
      const relationshipCustomer = resource?.relationships?.customer?.data?.id || null;
      const providerStatus = attrs.status || 'Pending';

      const localApplications = await base44.asServiceRole.entities.Application.filter({ user_id: targetUserId }, '-created_date', 10);
      const local = localApplications?.[0];
      if (local) {
        await base44.asServiceRole.entities.Application.update(local.id, {
          provider: 'unit',
          provider_application_id: resource?.id,
          provider_customer_id: relationshipCustomer,
          provider_status: providerStatus,
          kyc_status: providerStatus === 'Approved' ? 'approved' : 'pending',
        });
      }

      return Response.json({
        success: true,
        provider: 'unit',
        application_id: resource?.id,
        customer_id: relationshipCustomer,
        status: providerStatus,
      });
    }

    if (action === 'get_application') {
      const applicationId = String(body.application_id || '');
      if (!applicationId) return jsonError('application_id is required');
      const response = await unitRequest(`/applications/${encodeURIComponent(applicationId)}`);
      const resource = extractResource(response);
      return Response.json({ success: true, provider: 'unit', application: resource });
    }

    if (action === 'create_deposit_account') {
      const targetUserId = String(body.user_id || user.id);
      assertTargetAccess(user, targetUserId);
      const providerCustomerId = String(body.provider_customer_id || '');
      if (!providerCustomerId) return jsonError('An approved Unit customer is required before opening an account.', 409);

      const applications = await base44.asServiceRole.entities.Application.filter({ user_id: targetUserId }, '-created_date', 50);
      const approved = (applications || []).find((item: any) => item.provider === 'unit' && item.provider_customer_id === providerCustomerId && item.provider_status === 'Approved');
      if (!approved) return jsonError('No approved Unit customer is linked to this Vantoris user.', 409);

      const accountType = body.account_type === 'Savings' ? 'savings' : 'checking';
      const requestBody = {
        data: {
          type: 'depositAccount',
          attributes: {
            depositProduct: accountType,
            tags: { vantorisUserId: targetUserId },
            idempotencyKey: idempotencyKey(`vantoris-account-${targetUserId}`),
          },
          relationships: {
            customer: { data: { type: 'customer', id: providerCustomerId } },
          },
        },
      };

      const response = await unitRequest('/accounts', {
        method: 'POST',
        body: requestBody,
        idempotencyKey: requestBody.data.attributes.idempotencyKey,
      });
      const resource = extractResource(response);
      const attrs = resourceAttributes(resource);
      if (!resource?.id || !attrs.accountNumber || !attrs.routingNumber) {
        return jsonError('Unit did not return a complete bank account. No local account was created.', 502);
      }

      const localAccount = await base44.asServiceRole.entities.Account.create({
        user_id: targetUserId,
        account_type: body.account_type || 'Checking',
        account_name: body.account_name || attrs.name || `${body.account_type || 'Checking'} Account`,
        account_number: attrs.accountNumber,
        routing_number: attrs.routingNumber,
        balance: Number(attrs.balance || 0) / 100,
        available_balance: Number(attrs.available || 0) / 100,
        status: attrs.status === 'Frozen' ? 'frozen' : attrs.status === 'Closed' ? 'closed' : 'active',
        application_id: approved.id,
        provider: 'unit',
        provider_account_id: resource.id,
        provider_customer_id: providerCustomerId,
        provider_status: attrs.status || 'Open',
        currency: attrs.currency || 'USD',
        last_provider_sync_at: new Date().toISOString(),
      });

      return Response.json({
        success: true,
        provider: 'unit',
        account_id: localAccount.id,
        provider_account_id: resource.id,
        account_number: attrs.accountNumber,
        routing_number: attrs.routingNumber,
        balance: Number(attrs.balance || 0) / 100,
        available_balance: Number(attrs.available || 0) / 100,
        status: attrs.status || 'Open',
      });
    }

    if (action === 'get_account') {
      const targetUserId = String(body.user_id || user.id);
      assertTargetAccess(user, targetUserId);
      const providerAccountId = String(body.provider_account_id || '');
      if (!providerAccountId) return jsonError('provider_account_id is required');
      const localAccounts = await base44.asServiceRole.entities.Account.filter({ user_id: targetUserId, provider: 'unit', provider_account_id: providerAccountId }, '-created_date', 5);
      if (!localAccounts?.length) return jsonError('Provider account is not linked to this Vantoris user.', 404);

      const response = await unitRequest(`/accounts/${encodeURIComponent(providerAccountId)}`);
      const resource = extractResource(response);
      const attrs = resourceAttributes(resource);
      await base44.asServiceRole.entities.Account.update(localAccounts[0].id, {
        balance: Number(attrs.balance || 0) / 100,
        available_balance: Number(attrs.available || 0) / 100,
        status: attrs.status === 'Frozen' ? 'frozen' : attrs.status === 'Closed' ? 'closed' : 'active',
        provider_status: attrs.status || 'Open',
        last_provider_sync_at: new Date().toISOString(),
      });
      return Response.json({ success: true, provider: 'unit', account: resource });
    }

    if (action === 'list_transactions') {
      const targetUserId = String(body.user_id || user.id);
      assertTargetAccess(user, targetUserId);
      const providerAccountId = String(body.provider_account_id || '');
      if (!providerAccountId) return jsonError('provider_account_id is required');
      const localAccounts = await base44.asServiceRole.entities.Account.filter({ user_id: targetUserId, provider: 'unit', provider_account_id: providerAccountId }, '-created_date', 5);
      if (!localAccounts?.length) return jsonError('Provider account is not linked to this Vantoris user.', 404);
      const response = await unitRequest(`/transactions?filter[accountId]=${encodeURIComponent(providerAccountId)}&page[limit]=100`);
      return Response.json({ success: true, provider: 'unit', transactions: response?.data || [] });
    }

    if (action === 'create_ach_payment') {
      const targetUserId = String(body.user_id || user.id);
      assertTargetAccess(user, targetUserId);
      const providerAccountId = String(body.provider_account_id || '');
      const counterpartyId = String(body.counterparty_id || '');
      const amountCents = Number(body.amount_cents);
      if (!providerAccountId || !counterpartyId || !Number.isInteger(amountCents) || amountCents <= 0) {
        return jsonError('provider_account_id, counterparty_id, and a positive integer amount_cents are required');
      }
      const localAccounts = await base44.asServiceRole.entities.Account.filter({ user_id: targetUserId, provider: 'unit', provider_account_id: providerAccountId }, '-created_date', 5);
      if (!localAccounts?.length) return jsonError('Provider account is not linked to this Vantoris user.', 404);

      const paymentIdempotencyKey = idempotencyKey(`vantoris-ach-${providerAccountId}`);
      const requestBody = {
        data: {
          type: 'achPayment',
          attributes: {
            amount: amountCents,
            direction: body.direction === 'Debit' ? 'Debit' : 'Credit',
            description: String(body.description || 'VANTORIS').slice(0, 10),
            addenda: body.addenda ? String(body.addenda).slice(0, 80) : undefined,
            idempotencyKey: paymentIdempotencyKey,
            sameDay: Boolean(body.same_day),
          },
          relationships: {
            account: { data: { type: 'account', id: providerAccountId } },
            counterparty: { data: { type: 'counterparty', id: counterpartyId } },
          },
        },
      };
      const response = await unitRequest('/payments', { method: 'POST', body: requestBody, idempotencyKey: paymentIdempotencyKey });
      const resource = extractResource(response);
      const attrs = resourceAttributes(resource);
      return Response.json({
        success: true,
        provider: 'unit',
        payment_id: resource?.id,
        status: attrs.status || 'Pending',
        amount_cents: attrs.amount,
        direction: attrs.direction,
      });
    }

    return jsonError('Unsupported Unit banking action', 400);
  } catch (error) {
    const status = Number(error?.status || 500);
    const safeStatus = status >= 400 && status < 600 ? status : 500;
    return jsonError(error?.message || 'Unit banking request failed', safeStatus);
  }
});
