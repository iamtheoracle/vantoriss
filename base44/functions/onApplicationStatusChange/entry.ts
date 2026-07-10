import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data, changed_fields } = body;

    if (event?.type !== 'update' || event?.entity_name !== 'Application') {
      return Response.json({ ok: true, skipped: true });
    }

    const app = data;
    if (!app || !app.user_id) {
      return Response.json({ ok: true, skipped: true, reason: 'no_user' });
    }

    const notifications = [];

    // Application status changed
    if (changed_fields && changed_fields.includes('application_status')) {
      const newStatus = app.application_status;
      const oldStatus = old_data?.application_status;

      if (newStatus === 'approved') {
        notifications.push({
          user_id: app.user_id,
          title: 'Application Approved',
          message: `Congratulations! Your ${app.account_type || ''} account application has been approved. Welcome to Vantoris.`,
          type: 'success',
          read: false,
        });
      } else if (newStatus === 'rejected') {
        notifications.push({
          user_id: app.user_id,
          title: 'Application Update',
          message: 'Your account application requires attention. Please check your application status for details.',
          type: 'warning',
          read: false,
        });
      }
    }

    // KYC status changed
    if (changed_fields && changed_fields.includes('kyc_status')) {
      const newKyc = app.kyc_status;
      if (newKyc === 'approved') {
        notifications.push({
          user_id: app.user_id,
          title: 'Identity Verified',
          message: 'Your KYC verification has been approved. Your account is now fully verified.',
          type: 'success',
          read: false,
        });
      } else if (newKyc === 'rejected') {
        notifications.push({
          user_id: app.user_id,
          title: 'KYC Update',
          message: 'Your identity verification requires attention. Please review and resubmit your documents.',
          type: 'warning',
          read: false,
        });
      }
    }

    // Opening contribution status changed
    if (changed_fields && changed_fields.includes('opening_contribution_status')) {
      const newContrib = app.opening_contribution_status;
      if (newContrib === 'approved') {
        notifications.push({
          user_id: app.user_id,
          title: 'Opening Contribution Confirmed',
          message: 'Your opening contribution has been received and confirmed. Your account is now active.',
          type: 'success',
          read: false,
        });
      } else if (newContrib === 'rejected') {
        notifications.push({
          user_id: app.user_id,
          title: 'Opening Contribution Update',
          message: 'There was an issue with your opening contribution. Please check your account for details.',
          type: 'warning',
          read: false,
        });
      }
    }

    // Create all pending notifications
    for (const n of notifications) {
      await base44.asServiceRole.entities.Notification.create(n);
    }

    return Response.json({ ok: true, notified: notifications.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});