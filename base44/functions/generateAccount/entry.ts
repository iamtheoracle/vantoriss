import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { extractResource, resourceAttributes, unitRequest } from '../../shared/unit.ts';

function errorResponse(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function isStaff(user: any) {
  return ['super_administrator', 'admin', 'operations_officer'].includes(user?.role);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json().catch(() => ({}));
    const { user_id, account_type, account_name, application_id } = body;
    if (!user_id || !account_type || !account_name) {
      return errorResponse('user_id, account_type, and account_name are required');
    }
    if (user_id !== user.id && !isStaff(user)) return errorResponse('You are not authorized to open an account for this user.', 403);

    const applications = await base44.asServiceRole.entities.Application.filter({ user_id }, '-created_date', 50);
    const application = application_id
      ? (applications || []).find((item: any) => item.id === application_id)
      : (applications || []).find((item: any) => item.provider === 'unit' && item.provider_status === 'Approved' && item.provider_customer_id);

    if (!application?.provider_customer_id || application.provider !== 'unit' || application.provider_status !== 'Approved') {
      return errorResponse('A verified and approved live banking-provider customer is required before an account can be opened.', 409);
    }

    const existing = await base44.asServiceRole.entities.Account.filter({ user_id, provider: 'unit', provider_customer_id: application.provider_customer_id }, '-created_date', 50);
    const sameType = (existing || []).find((item: any) => item.account_type === account_type && item.status !== 'closed');
    if (sameType) {
      return Response.json({
        success: true,
        provider: 'unit',
        account_id: sameType.id,
        provider_account_id: sameType.provider_account_id,
        account_number: sameType.account_number,
        routing_number: sameType.routing_number,
        balance: sameType.balance || 0,
        existing: true,
      });
    }

    const depositProduct = account_type === 'Savings' ? 'savings' : 'checking';
    const idempotencyKey = `vantoris-account-${user_id}-${depositProduct}`;
    const response = await unitRequest('/accounts', {
      method: 'POST',
      idempotencyKey,
      body: {
        data: {
          type: 'depositAccount',
          attributes: {
            depositProduct,
            tags: { vantorisUserId: user_id },
            idempotencyKey,
          },
          relationships: {
            customer: { data: { type: 'customer', id: application.provider_customer_id } },
          },
        },
      },
    });

    const resource = extractResource(response);
    const attrs = resourceAttributes(resource);
    if (!resource?.id || !attrs.accountNumber || !attrs.routingNumber) {
      return errorResponse('The banking provider did not return a complete account. No Vantoris account was created.', 502);
    }

    const account = await base44.asServiceRole.entities.Account.create({
      user_id,
      account_type,
      account_name,
      account_number: attrs.accountNumber,
      routing_number: attrs.routingNumber,
      balance: Number(attrs.balance || 0) / 100,
      available_balance: Number(attrs.available || 0) / 100,
      status: attrs.status === 'Frozen' ? 'frozen' : attrs.status === 'Closed' ? 'closed' : 'active',
      application_id: application.id,
      provider: 'unit',
      provider_account_id: resource.id,
      provider_customer_id: application.provider_customer_id,
      provider_status: attrs.status || 'Open',
      currency: attrs.currency || 'USD',
      last_provider_sync_at: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.Notification.create({
      user_id,
      title: 'Account Opened',
      message: `Your ${account_type} account has been opened by the banking provider.`,
      type: 'success',
    });

    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'account_created',
      description: `Provider-backed ${account_type} account created for user ${user_id}`,
      details: `Provider: Unit; Provider Account ID: ${resource.id}`,
      target_user_id: user_id,
      user_id: user.id,
      admin_name: user.full_name || user.email || 'Admin',
    });

    return Response.json({
      success: true,
      provider: 'unit',
      account_id: account.id,
      provider_account_id: resource.id,
      account_number: attrs.accountNumber,
      routing_number: attrs.routingNumber,
      account_type,
      account_name,
      balance: Number(attrs.balance || 0) / 100,
      available_balance: Number(attrs.available || 0) / 100,
      status: attrs.status || 'Open',
    });
  } catch (error) {
    const status = Number(error?.status || 500);
    return errorResponse(error?.message || 'Unable to create provider-backed account.', status >= 400 && status < 600 ? status : 500);
  }
});
