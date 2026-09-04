import { base44 } from '@/api/base44Client';
import { getRoleCapabilities, isSuperAdmin } from '@/lib/operationsAccess';

export const ROLE_DIVISIONS = {
  super_administrator: ['command', 'intelligence', 'operations', 'compliance', 'security', 'support', 'logistics', 'humanitarian', 'reconnaissance', 'finance', 'markets', 'portfolio', 'risk', 'navigation', 'records', 'communications'],
  admin: ['command', 'intelligence', 'operations', 'compliance', 'security', 'support', 'finance', 'risk', 'records', 'communications'],
  administrator: ['command', 'intelligence', 'operations', 'compliance', 'security', 'support', 'finance', 'risk', 'records', 'communications'],
  executive: ['command', 'intelligence', 'operations', 'compliance', 'security', 'support', 'finance', 'markets', 'risk', 'records', 'communications'],
  operations_manager: ['command', 'operations', 'finance', 'risk', 'records', 'communications'],
  operations_officer: ['operations', 'finance', 'records', 'communications'],
  finance_officer: ['operations', 'finance', 'risk', 'records'],
  treasury_officer: ['operations', 'finance', 'risk', 'records', 'communications'],
  compliance_officer: ['compliance', 'security', 'risk', 'records', 'communications'],
  kyc_officer: ['compliance', 'security', 'records', 'communications'],
  auditor: ['intelligence', 'compliance', 'risk', 'records'],
  risk_officer: ['risk', 'compliance', 'finance', 'records'],
  customer_support: ['support', 'communications', 'records', 'navigation'],
  herobox_manager: ['logistics', 'humanitarian', 'reconnaissance', 'intelligence', 'communications', 'finance'],
  volunteer_manager: ['humanitarian', 'logistics', 'reconnaissance', 'communications'],
  shipping_manager: ['logistics', 'communications', 'records'],
  investment_manager: ['markets', 'portfolio', 'finance', 'risk', 'intelligence', 'records', 'communications'],
  investment_officer: ['markets', 'portfolio', 'finance', 'risk', 'intelligence', 'records'],
  it_administrator: ['command', 'security', 'operations', 'records'],
};

export const COMMAND_OPERATING_MODEL = Object.freeze({
  identity: 'Vantoris is a coordinated professional institution implemented as software.',
  workforce: 'Command coordinates specialized professional divisions; divisions do not behave as independent personas or generic chatbots.',
  lifecycle: ['observe', 'investigate', 'analyze', 'corroborate', 'assess', 'collaborate', 'recommend', 'authorize', 'execute', 'verify', 'record', 'learn'],
  principles: [
    'Evidence before assertion.',
    'Use the minimum necessary divisions and context.',
    'A recommendation is not authorization.',
    'Authorization is not execution.',
    'Execution is not verified completion until the underlying system confirms success.',
    'Preserve uncertainty, conflicts, provenance, freshness, and failure states.',
    'Never create activity merely to make Vantoris appear alive.',
  ],
});

export function getOperatorDivisions(user) {
  if (isSuperAdmin(user)) return ROLE_DIVISIONS.super_administrator;
  return ROLE_DIVISIONS[user?.role] || [];
}

export async function loadOperatorContext(user) {
  if (!user) return { mode: 'member', role: 'member', divisions: [], capabilities: [] };
  const operator = getOperatorDivisions(user).length > 0 || isSuperAdmin(user);
  if (!operator) return { mode: 'member', role: user.role || 'member', divisions: [], capabilities: [] };

  const profiles = await base44.entities.OperationalProfile.filter({ user_id: user.id }, '-created_date', 1).catch(() => []);
  const profile = profiles?.[0] || null;
  return {
    mode: 'operator',
    role: user.role || 'operator',
    position: profile?.position || '',
    department: profile?.department || '',
    profile_role: profile?.role || '',
    divisions: getOperatorDivisions(user),
    capabilities: getRoleCapabilities(user.role),
    operating_model: COMMAND_OPERATING_MODEL,
  };
}

export function buildAgentConversationMetadata(user, context) {
  return {
    name: context?.mode === 'operator' ? `${context.position || context.role || 'Operator'} session` : 'Member assistance session',
    description: context?.mode === 'operator' ? 'Role-aware Vantoris operator session' : 'Member assistance session',
    user_id: user?.id || '',
    user_role: context?.role || user?.role || 'member',
    account_mode: context?.mode || 'member',
    operator_department: context?.department || '',
    operator_position: context?.position || '',
    operator_profile_role: context?.profile_role || '',
    allowed_command_divisions: context?.divisions || [],
    allowed_capabilities: context?.capabilities || [],
    command_operating_model: context?.mode === 'operator' ? COMMAND_OPERATING_MODEL : undefined,
  };
}
