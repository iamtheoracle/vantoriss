// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  isAllowedFinancialRole,
  isRecord,
  jsonResponse,
  writeBlockedMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;

/**
 * Financial imports are deliberately fail-closed until an atomic batch-posting
 * service owns the transaction and account records. Sequential entity CRUD
 * can leave a transaction posted without its balance update (or vice versa).
 */
export default async function bulkImportTransactions(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  let base44: Base44Client;
  let actor: AuthenticatedActor | null;
  try {
    base44 = createClientFromRequest(req) as Base44Client;
    const user = await base44.auth.me();
    actor = user ? {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    } : null;
  } catch {
    return jsonResponse({ error: 'Authentication could not be verified.' }, 401);
  }

  if (!actor?.id) return jsonResponse({ error: 'Authentication required.' }, 401);
  if (!isAllowedFinancialRole(actor)) {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'transaction.bulk_import', 'unknown', 'role_not_authorized',
    );
    return jsonResponse({
      error: 'You are not authorized to import financial transactions.',
      audit_recorded: auditRecorded,
    }, 403);
  }

  const parsedBody: unknown = await req.json().catch(() => null);
  if (!isRecord(parsedBody) || !Array.isArray(parsedBody.transactions) ||
      parsedBody.transactions.length === 0) {
    return jsonResponse({ error: 'A non-empty transactions array is required.' }, 400);
  }
  if (parsedBody.transactions.length > 500) {
    return jsonResponse({ error: 'Maximum 500 transactions per import.' }, 400);
  }

  // Do not fall back to service-role CRUD. Each row must be validated and
  // committed with its account balance and audit record in one atomic batch.
  const auditRecorded = await writeBlockedMutationAudit(
    base44,
    actor,
    'transaction.bulk_import',
    'batch',
    'ATOMIC_BATCH_IMPORT_REQUIRED',
  );
  return jsonResponse({
    error: 'Financial imports are temporarily unavailable until atomic batch posting is configured. No transactions or balances were changed.',
    code: 'ATOMIC_BATCH_IMPORT_REQUIRED',
    audit_recorded: auditRecorded,
  }, 503);
}
