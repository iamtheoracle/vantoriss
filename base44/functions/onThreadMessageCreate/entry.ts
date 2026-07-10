import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    // Only act on new ThreadMessage records
    if (event?.type !== 'create' || event?.entity_name !== 'ThreadMessage') {
      return Response.json({ ok: true, skipped: true });
    }

    const message = data;
    if (!message) {
      return Response.json({ ok: true, skipped: true });
    }

    // Only notify when an admin sends a message to a member
    if (message.sender !== 'admin') {
      return Response.json({ ok: true, skipped: true, reason: 'not_admin_message' });
    }

    // Look up the thread for the subject
    const thread = await base44.asServiceRole.entities.MessageThread.get(message.thread_id).catch(() => null);
    const subject = thread?.subject || 'New Message';

    // Create a notification for the member
    await base44.asServiceRole.entities.Notification.create({
      user_id: message.user_id,
      title: subject,
      message: message.body ? message.body.slice(0, 150) : 'You have a new message',
      type: 'info',
      read: false,
    });

    // Mark the thread as unread for the member
    if (thread) {
      await base44.asServiceRole.entities.MessageThread.update(thread.id, {
        unread_by_member: true,
        last_sender: 'admin',
        last_message: (message.body || '').slice(0, 200),
        last_message_date: message.created_date || new Date().toISOString(),
      });
    }

    return Response.json({ ok: true, notified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});