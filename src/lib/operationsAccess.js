// ============================================================
// VANTORIS — Authority & Permission Model (Source of Truth)
// ============================================================
// Domains: Management · Support · HeroBox · Investment
// Super Administrator sits above all four domains.
// Each domain has granular capabilities — domain alone does NOT
// grant unlimited authority.
// ============================================================

// ---- Super Administrator ----
export const SUPER_ADMIN_EMAIL = 'itsandrewjack@gmail.com';

export function isSuperAdmin(user) {
  if (!user) return false;
  return user.email?.toLowerCase() === SUPER_ADMIN_EMAIL || user.role === 'super_administrator';
}

// ---- Four Operational Domains ----
export const DOMAINS = {
  management: 'Management',
  support: 'Support',
  herobox: 'HeroBox',
  investment: 'Investment',
};

// ---- Domain Capabilities (granular permissions) ----
export const DOMAIN_CAPABILITIES = {
  management: {
    operations: 'Operations — applications, accounts, transactions, cards, Zelle, statements, historical data',
    kyc_compliance: 'KYC / Compliance — identity review, ID verification, compliance decisions',
    customer_accounts: 'Customer & Account Management — profiles, account records, account requests',
    security: 'Security — security events, sessions, access controls, policies',
    system_admin: 'System Administration — configuration, integrations, notifications',
    administration: 'Administration — admin accounts, roles, permissions, audit logs',
  },
  support: {
    customer_support: 'Customer Support — conversations, escalations, status communication',
  },
  herobox: {
    catalog: 'Catalog — products, categories, package stages, contents',
    orders: 'Orders — order management, fulfillment, tracking',
    shipping: 'Shipping — destinations, shipping rules, tracking',
    herobox_operations: 'HeroBox Operations — verified needs, content, campaigns',
  },
  investment: {
    portfolio_operations: 'Portfolio Operations — portfolios, positions, investment transactions',
    deposits: 'Deposits — review and approve investment deposit requests',
    withdrawals: 'Withdrawals — review and approve investment withdrawal requests',
    investment_products: 'Investment Products — manage investment products',
    signals: 'Signals — manage investment signals and risk information',
    investment_operations: 'Investment Operations — investment-specific customer operations',
  },
};

// ---- Role → Domain + Capabilities Mapping ----
// Super Administrator gets all domains + all capabilities.
// Other roles get specific domains + specific capabilities.
const ROLE_PERMISSIONS = {
  super_administrator: {
    domains: ['management', 'support', 'herobox', 'investment'],
    capabilities: { management: 'all', support: 'all', herobox: 'all', investment: 'all' },
  },
  admin: {
    domains: ['management'],
    capabilities: { management: ['operations', 'kyc_compliance', 'customer_accounts', 'system_admin'] },
  },
  administrator: {
    domains: ['management'],
    capabilities: { management: ['operations', 'kyc_compliance', 'customer_accounts', 'system_admin'] },
  },
  executive: {
    domains: ['management'],
    capabilities: { management: ['operations', 'kyc_compliance', 'customer_accounts', 'administration'] },
  },
  operations_manager: {
    domains: ['management'],
    capabilities: { management: ['operations', 'customer_accounts'] },
  },
  operations_officer: {
    domains: ['management'],
    capabilities: { management: ['operations'] },
  },
  finance_officer: {
    domains: ['management'],
    capabilities: { management: ['operations'] },
  },
  treasury_officer: {
    domains: ['management'],
    capabilities: { management: ['operations'] },
  },
  compliance_officer: {
    domains: ['management'],
    capabilities: { management: ['kyc_compliance', 'security'] },
  },
  kyc_officer: {
    domains: ['management'],
    capabilities: { management: ['kyc_compliance'] },
  },
  auditor: {
    domains: ['management'],
    capabilities: { management: ['administration'] },
  },
  it_administrator: {
    domains: ['management'],
    capabilities: { management: ['system_admin', 'security'] },
  },
  risk_officer: {
    domains: ['management'],
    capabilities: { management: ['security'] },
  },
  customer_support: {
    domains: ['support'],
    capabilities: { support: ['customer_support'] },
  },
  herobox_manager: {
    domains: ['herobox'],
    capabilities: { herobox: ['catalog', 'orders', 'shipping', 'herobox_operations'] },
  },
  volunteer_manager: {
    domains: ['herobox'],
    capabilities: { herobox: ['herobox_operations'] },
  },
  shipping_manager: {
    domains: ['herobox'],
    capabilities: { herobox: ['shipping', 'orders'] },
  },
  investment_manager: {
    domains: ['investment'],
    capabilities: { investment: ['portfolio_operations', 'deposits', 'withdrawals', 'investment_products', 'signals', 'investment_operations'] },
  },
  investment_officer: {
    domains: ['investment'],
    capabilities: { investment: ['portfolio_operations', 'investment_operations'] },
  },
};

// ---- Core Permission Checks ----

export function getDomainsForRole(role) {
  if (role === 'super_administrator') return ['management', 'support', 'herobox', 'investment'];
  return ROLE_PERMISSIONS[role]?.domains || [];
}

export function getCapabilitiesForRole(role, domain) {
  if (role === 'super_administrator') return 'all';
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return [];
  const caps = perms.capabilities[domain];
  if (!caps) return [];
  return caps === 'all' ? Object.keys(DOMAIN_CAPABILITIES[domain] || {}) : caps;
}

export function hasDomainAccess(role, domain) {
  if (role === 'super_administrator') return true;
  return getDomainsForRole(role).includes(domain);
}

export function hasCapability(role, domain, capability) {
  if (role === 'super_administrator') return true;
  const caps = getCapabilitiesForRole(role, domain);
  if (caps === 'all') return true;
  return Array.isArray(caps) && caps.includes(capability);
}

export function canManageAdmins(role) {
  return role === 'super_administrator' || hasCapability(role, 'management', 'administration');
}

export function canManageSecurity(role) {
  return role === 'super_administrator' || hasCapability(role, 'management', 'security');
}

export function canManageSystemConfig(role) {
  return role === 'super_administrator' || hasCapability(role, 'management', 'system_admin');
}

export function canApproveKYC(role) {
  return role === 'super_administrator' || hasCapability(role, 'management', 'kyc_compliance');
}

export function canApproveAccounts(role) {
  return role === 'super_administrator' || hasCapability(role, 'management', 'operations');
}

export function canApproveWithdrawals(role) {
  return role === 'super_administrator' || hasCapability(role, 'management', 'operations');
}

export function canManageHeroBoxCatalog(role) {
  return role === 'super_administrator' || hasCapability(role, 'herobox', 'catalog');
}

export function canManageHeroBoxOrders(role) {
  return role === 'super_administrator' || hasCapability(role, 'herobox', 'orders');
}

export function canManageInvestmentDeposits(role) {
  return role === 'super_administrator' || hasCapability(role, 'investment', 'deposits');
}

export function canManageInvestmentWithdrawals(role) {
  return role === 'super_administrator' || hasCapability(role, 'investment', 'withdrawals');
}

export function canUseUltimateCommand(user) {
  return isSuperAdmin(user);
}

// ---- Operator Groups (backward compat) ----

export function getOperatorGroup(role) {
  if (isSuperAdmin({ role, email: '' }) || role === 'super_administrator') return 'management';
  const domains = getDomainsForRole(role);
  if (domains.includes('management')) return 'management';
  if (domains.includes('support')) return 'support';
  if (domains.includes('herobox')) return 'herobox';
  if (domains.includes('investment')) return 'investment';
  return null;
}

export function isManagementOperator(role) {
  return getDomainsForRole(role).includes('management');
}

export function isCustomerSupportOperator(role) {
  return getDomainsForRole(role).includes('support');
}

export function isHeroBoxOperator(role) {
  return getDomainsForRole(role).includes('herobox');
}

export function isInvestmentOperator(role) {
  return getDomainsForRole(role).includes('investment');
}

// ---- Backward-compatible exports (preserved for existing pages) ----

const OPERATIONS_ROLES = [
  'admin', 'operations_officer', 'finance_officer', 'compliance_officer',
  'executive', 'administrator', 'super_administrator', 'customer_support',
  'kyc_officer', 'operations_manager', 'treasury_officer', 'auditor',
  'it_administrator', 'risk_officer', 'herobox_manager', 'volunteer_manager',
  'shipping_manager', 'investment_manager', 'investment_officer',
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
    customer_support: 'Customer Support',
    kyc_officer: 'KYC Officer',
    operations_manager: 'Operations Manager',
    treasury_officer: 'Treasury Officer',
    auditor: 'Auditor',
    it_administrator: 'IT Administrator',
    risk_officer: 'Risk Officer',
    herobox_manager: 'HeroBox Manager',
    volunteer_manager: 'Volunteer Manager',
    shipping_manager: 'Shipping Manager',
    investment_manager: 'Investment Manager',
    investment_officer: 'Investment Officer',
  };
  return labels[role] || 'Member';
}

// ---- Workspace compat (maps old workspaces → new domains) ----
export const WORKSPACE_LABELS = {
  management: 'Management',
  support: 'Support',
  herobox: 'HeroBox',
  investment: 'Investment',
  // Legacy aliases
  executive: 'Management',
  operations: 'Management',
  security: 'Management',
};

export const WORKSPACE_ICONS = {
  management: 'Briefcase',
  support: 'Headphones',
  herobox: 'Radar',
  investment: 'TrendingUp',
};

export function getWorkspacesForRole(role) {
  return getDomainsForRole(role);
}

export function hasWorkspaceAccess(role, workspace) {
  // Map legacy workspace names to domains
  const domainMap = { executive: 'management', operations: 'management', security: 'management' };
  const domain = domainMap[workspace] || workspace;
  return hasDomainAccess(role, domain);
}

export function getDefaultWorkspace(role) {
  const domains = getDomainsForRole(role);
  if (domains.length === 0) return null;
  if (domains.includes('management')) return 'management';
  return domains[0];
}