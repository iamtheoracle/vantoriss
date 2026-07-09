// ============================================================
// VANTORIS Operations Center — Role & Workspace Access Control
// ============================================================
// Three administrative workspaces, each gated by role.
// Existing functions preserved for backward compatibility.
// ============================================================

const OPERATIONS_ROLES = [
  'admin',
  'operations_officer',
  'finance_officer',
  'compliance_officer',
  'executive',
  'administrator',
  'super_administrator',
  'customer_support',
  'kyc_officer',
  'operations_manager',
  'treasury_officer',
  'auditor',
  'it_administrator',
  'risk_officer',
];

// Workspace → roles that can access it
const WORKSPACE_ROLES = {
  executive: ['super_administrator', 'executive', 'administrator', 'admin'],
  operations: [
    'super_administrator', 'administrator', 'admin',
    'operations_officer', 'customer_support', 'kyc_officer', 'operations_manager',
  ],
  security: [
    'super_administrator', 'administrator', 'admin',
    'compliance_officer', 'finance_officer', 'treasury_officer',
    'auditor', 'it_administrator', 'risk_officer',
  ],
};

// ---- Backward-compatible exports (unchanged signatures) ----

export function hasOperationsAccess(role) {
  return OPERATIONS_ROLES.includes(role);
}

export function isOperationsRole(role) {
  return OPERATIONS_ROLES.includes(role) && role !== 'admin';
}

export function getRoleLabel(role) {
  const labels = {
    user: 'Member',
    operations_officer: 'Operations Officer',
    finance_officer: 'Finance Officer',
    compliance_officer: 'Compliance Officer',
    executive: 'Executive',
    administrator: 'Administrator',
    super_administrator: 'Super Administrator',
    admin: 'Administrator',
    customer_support: 'Customer Support',
    kyc_officer: 'KYC Officer',
    operations_manager: 'Operations Manager',
    treasury_officer: 'Treasury Officer',
    auditor: 'Auditor',
    it_administrator: 'IT Administrator',
    risk_officer: 'Risk Officer',
  };
  return labels[role] || 'Member';
}

// ---- New workspace exports ----

export function getWorkspacesForRole(role) {
  return Object.entries(WORKSPACE_ROLES)
    .filter(([, roles]) => roles.includes(role))
    .map(([ws]) => ws);
}

export function hasWorkspaceAccess(role, workspace) {
  const roles = WORKSPACE_ROLES[workspace];
  return roles ? roles.includes(role) : false;
}

export function getDefaultWorkspace(role) {
  const ws = getWorkspacesForRole(role);
  if (ws.length === 0) return null;
  // Executive roles → executive workspace by default
  if (ws.includes('executive')) return 'executive';
  // Security-only roles → security workspace
  if (ws.includes('security') && !ws.includes('operations')) return 'security';
  return ws[0];
}

export const WORKSPACE_LABELS = {
  executive: 'Executive',
  operations: 'Operations',
  security: 'Security & Compliance',
};

export const WORKSPACE_ICONS = {
  executive: 'Crown',
  operations: 'Briefcase',
  security: 'ShieldCheck',
};