import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';

const ADMIN_EMAIL = 'operations@vantoris.com';

/**
 * Sends email notification to the member AND the admin team
 * whenever a new transaction or balance adjustment is recorded.
 */
export async function sendTransactionEmail({ user_id, account, type, amount, description, newBalance }) {
  try {
    const users = await base44.entities.User.list('-created_date', 100);
    const member = users.find(u => u.id === user_id);
    const memberEmail = member?.email || '';
    const memberName = member?.full_name || 'Member';

    const typeLabel = type === 'deposit' ? 'Deposit Credited'
      : type === 'withdrawal' ? 'Withdrawal Processed'
      : type === 'opening_balance' ? 'Opening Balance'
      : 'Account Adjustment';

    const isCredit = type === 'deposit' || type === 'opening_balance' || (type === 'adjustment' && amount >= 0);

    const subject = `Vantoris — ${typeLabel}: ${formatCurrency(Math.abs(amount))}`;
    const body = `Dear ${memberName},\n\nA transaction has been recorded on your account:\n\nType: ${typeLabel}\nAmount: ${isCredit ? '+' : '-'}${formatCurrency(Math.abs(amount))}\nDescription: ${description || typeLabel}\nNew Balance: ${formatCurrency(newBalance)}\nAccount: ${account?.account_name || ''} (${account?.account_number || ''})\n\nIf you did not authorize this transaction, please contact us immediately.\n\nWarm regards,\nThe Vantoris Team`;

    const promises = [];

    if (memberEmail) {
      promises.push(base44.integrations.Core.SendEmail({ to: memberEmail, subject, body }));
    }

    // Admin team notification
    promises.push(base44.integrations.Core.SendEmail({
      to: ADMIN_EMAIL,
      subject: `[ADMIN] ${subject}`,
      body: `ADMIN NOTIFICATION\n\nMember: ${memberName} (${memberEmail})\n\n${body}`,
    }));

    await Promise.all(promises);
  } catch (e) {
    console.error('Transaction email notification failed:', e);
  }
}