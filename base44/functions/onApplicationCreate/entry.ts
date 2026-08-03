import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== 'create' || event?.entity_name !== 'Application') {
      return Response.json({ ok: true, skipped: true });
    }

    const app = data;
    if (!app || !app.user_id) {
      return Response.json({ ok: true, skipped: true, reason: 'no_user' });
    }

    const accountType = app.account_type || 'account';
    const notifications = [];

    // Standard KYC notification — required for all account types (US banking compliance)
    notifications.push({
      user_id: app.user_id,
      title: 'Identity Verification Required',
      message: `To activate your ${accountType} account, complete identity verification. Required documents: Government-issued photo ID (Driver's License or State ID), Social Security Number (SSN) or ITIN, Proof of address (utility bill or bank statement), and selfie verification.`,
      type: 'action',
      read: false,
    });

    // Additional compliance for Joint accounts — co-applicant verification
    if (accountType === 'Joint') {
      notifications.push({
        user_id: app.user_id,
        title: 'Co-Applicant Verification Required',
        message: 'Your Joint account requires co-applicant identity verification. The co-applicant must complete the same KYC process: Government-issued photo ID, SSN/ITIN, proof of address, and selfie verification. Both account holders must be verified before the account can be activated.',
        type: 'action',
        read: false,
      });
    }

    // Additional compliance for Business accounts — enhanced due diligence
    if (accountType === 'Business') {
      notifications.push({
        user_id: app.user_id,
        title: 'Business Verification Required',
        message: `Your Business account requires enhanced verification. Please prepare: EIN (Employer Identification Number) verification, Business formation documents (Articles of Incorporation/Organization), Beneficial ownership disclosure, and Authorized signer identification. Business type: ${app.business_type || 'Not specified'}.`,
        type: 'action',
        read: false,
      });
    }

    // Opening deposit notification
    notifications.push({
      user_id: app.user_id,
      title: 'Opening Deposit Required',
      message: `An opening deposit is required to activate your ${accountType} account. Accepted methods: Direct Deposit, ACH Transfer, Wire Transfer, Mobile Check Deposit, Cashier's Check, or Personal Check. Visit the Opening Deposit section to submit your payment.`,
      type: 'info',
      read: false,
    });

    // Create all notifications
    for (const n of notifications) {
      await base44.asServiceRole.entities.Notification.create(n);
    }

    return Response.json({ ok: true, notified: notifications.length, accountType });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}