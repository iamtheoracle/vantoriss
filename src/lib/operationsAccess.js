const OPERATIONS_ROLES = [
  'admin',
  'operations_officer',
  'finance_officer',
  'compliance_officer',
  'executive',
  'administrator',
  'super_administrator',
];

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
  };
  return labels[role] || 'Member';
}