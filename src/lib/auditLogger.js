import { base44 } from '@/api/base44Client';

/**
 * Creates an audit log entry for an admin action.
 * Call this after every admin-initiated balance change, transaction edit,
 * withdrawal processing, or application/KYC decision.
 */
export async function logAuditEntry({ action_type, description, details, account_id, amount, balance_before, balance_after, target_user_id }) {
  try {
    const me = await base44.auth.me();
    await base44.entities.AuditLog.create({
      action_type,
      description,
      details: details || '',
      account_id: account_id || null,
      user_id: me.id,
      admin_name: me.full_name || me.email || 'Admin',
      amount: amount != null ? amount : null,
      balance_before: balance_before != null ? balance_before : null,
      balance_after: balance_after != null ? balance_after : null,
      target_user_id: target_user_id || null,
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}