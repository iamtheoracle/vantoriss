// ============================================================
// VANTORIS Product & Service Catalog
// Single source of truth for every product on the platform.
// To add a new product: add an entry here. No other file needs
// to change for visibility, entitlements, or workflow rules.
// ============================================================

// ---- Enums ----

export const ProductCategory = {
  Banking: 'Banking',
  Investing: 'Investing',
  Credit: 'Credit',
  Services: 'Services',
  Impact: 'Impact',
};

export const ProductStatus = {
  Available: 'Available',
  ComingSoon: 'ComingSoon',
  Disabled: 'Disabled',
  Legacy: 'Legacy',
};

export const KYCLevel = {
  Basic: 'Basic',
  Enhanced: 'Enhanced',
  Full: 'Full',
};

// ---- Workflow Stages ----

export const WorkflowStage = {
  NotApplied: 'NotApplied',
  EligibleToApply: 'EligibleToApply',
  ApplicationStarted: 'ApplicationStarted',
  DocumentsPending: 'DocumentsPending',
  UnderReview: 'UnderReview',
  AdditionalInfoRequired: 'AdditionalInfoRequired',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Active: 'Active',
  Suspended: 'Suspended',
  Closed: 'Closed',
};

// ---- Product Definitions ----

const PRODUCTS = [
  // ---- Banking ----
  {
    id: 'personal_checking',
    name: 'Personal Checking Account',
    shortName: 'Checking',
    description: 'Your primary everyday banking account with full debit and transfer capabilities.',
    category: ProductCategory.Banking,
    icon: 'CreditCard',

    status: ProductStatus.Available,

    eligibilityRequirements: {
      minAge: 18,
      minIncomeRequired: false,
      creditScoreMinimum: 0,
      residencyRequired: [],
      countriesSupported: ['US', 'CA', 'GB', 'AU'],
      currenciesSupported: ['USD', 'CAD', 'GBP', 'AUD'],
    },

    approvalWorkflow: {
      stages: Object.values(WorkflowStage),
      requiresKYC: true,
      kycLevel: KYCLevel.Basic,
      requiredDocuments: ['government_id', 'proof_of_address'],
      approvalTimeframe: '1–2 business days',
    },

    memberEntitlements: {
      permissions: [
        'view_balance', 'make_transfer', 'view_statements',
        'deposit_funds', 'withdraw_funds', 'manage_card',
      ],
      features: ['debit_card', 'direct_deposit', 'bill_pay', 'mobile_check_deposit'],
      limits: {
        dailyTransfer: 10000,
        monthlyTransactions: 500,
        balance_max: 250000,
      },
    },

    navigation: {
      mainMenu: true,
      moreSection: false,
      menuLabel: 'Accounts',
      route: '/accounts',
      icon: 'Landmark',
    },

    dashboardWidgets: ['accounts_summary', 'recent_transactions', 'quick_transfer'],
    quickActions: ['transfer', 'pay_bill', 'deposit', 'withdraw'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.EligibleToApply],
      [WorkflowStage.EligibleToApply]: [WorkflowStage.ApplicationStarted],
      [WorkflowStage.ApplicationStarted]: [WorkflowStage.DocumentsPending],
      [WorkflowStage.DocumentsPending]: [WorkflowStage.UnderReview],
      [WorkflowStage.UnderReview]: [WorkflowStage.AdditionalInfoRequired, WorkflowStage.Approved, WorkflowStage.Rejected],
      [WorkflowStage.AdditionalInfoRequired]: [WorkflowStage.UnderReview, WorkflowStage.Rejected],
      [WorkflowStage.Approved]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Suspended, WorkflowStage.Closed],
      [WorkflowStage.Suspended]: [WorkflowStage.Active, WorkflowStage.Closed],
      [WorkflowStage.Rejected]: [],
      [WorkflowStage.Closed]: [],
    },
  },

  {
    id: 'joint_checking',
    name: 'Joint Checking Account',
    shortName: 'Joint Checking',
    description: 'A shared checking account for two account holders with equal access.',
    category: ProductCategory.Banking,
    icon: 'Users',

    status: ProductStatus.Available,

    eligibilityRequirements: {
      minAge: 18,
      minIncomeRequired: false,
      creditScoreMinimum: 0,
      residencyRequired: [],
      countriesSupported: ['US', 'CA', 'GB'],
      currenciesSupported: ['USD', 'CAD', 'GBP'],
    },

    approvalWorkflow: {
      stages: Object.values(WorkflowStage),
      requiresKYC: true,
      kycLevel: KYCLevel.Enhanced,
      requiredDocuments: ['government_id', 'proof_of_address', 'joint_account_agreement'],
      approvalTimeframe: '2–3 business days',
    },

    memberEntitlements: {
      permissions: [
        'view_balance', 'make_transfer', 'view_statements',
        'deposit_funds', 'withdraw_funds', 'manage_card',
      ],
      features: ['debit_card', 'direct_deposit', 'bill_pay', 'joint_account_management'],
      limits: {
        dailyTransfer: 15000,
        monthlyTransactions: 500,
        balance_max: 500000,
      },
    },

    navigation: {
      mainMenu: false,
      moreSection: true,
      menuLabel: 'Joint Checking',
      route: '/accounts',
      icon: 'Users',
    },

    dashboardWidgets: ['accounts_summary', 'recent_transactions'],
    quickActions: ['transfer', 'pay_bill', 'deposit'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.EligibleToApply],
      [WorkflowStage.EligibleToApply]: [WorkflowStage.ApplicationStarted],
      [WorkflowStage.ApplicationStarted]: [WorkflowStage.DocumentsPending],
      [WorkflowStage.DocumentsPending]: [WorkflowStage.UnderReview],
      [WorkflowStage.UnderReview]: [WorkflowStage.AdditionalInfoRequired, WorkflowStage.Approved, WorkflowStage.Rejected],
      [WorkflowStage.AdditionalInfoRequired]: [WorkflowStage.UnderReview, WorkflowStage.Rejected],
      [WorkflowStage.Approved]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Suspended, WorkflowStage.Closed],
      [WorkflowStage.Suspended]: [WorkflowStage.Active, WorkflowStage.Closed],
      [WorkflowStage.Rejected]: [],
      [WorkflowStage.Closed]: [],
    },
  },

  {
    id: 'savings',
    name: 'Savings Account',
    shortName: 'Savings',
    description: 'A high-yield savings account to grow your money securely.',
    category: ProductCategory.Banking,
    icon: 'PiggyBank',

    status: ProductStatus.Available,

    eligibilityRequirements: {
      minAge: 18,
      minIncomeRequired: false,
      creditScoreMinimum: 0,
      residencyRequired: [],
      countriesSupported: ['US', 'CA', 'GB', 'AU'],
      currenciesSupported: ['USD', 'CAD', 'GBP', 'AUD'],
    },

    approvalWorkflow: {
      stages: Object.values(WorkflowStage),
      requiresKYC: true,
      kycLevel: KYCLevel.Basic,
      requiredDocuments: ['government_id'],
      approvalTimeframe: '1 business day',
    },

    memberEntitlements: {
      permissions: ['view_balance', 'make_transfer', 'view_statements', 'deposit_funds', 'withdraw_funds'],
      features: ['auto_save', 'interest_tracking', 'savings_goals'],
      limits: {
        dailyTransfer: 25000,
        monthlyTransactions: 50,
        balance_max: 1000000,
      },
    },

    navigation: {
      mainMenu: false,
      moreSection: true,
      menuLabel: 'Savings',
      route: '/accounts',
      icon: 'PiggyBank',
    },

    dashboardWidgets: ['savings_summary', 'interest_earned'],
    quickActions: ['transfer', 'deposit'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.EligibleToApply],
      [WorkflowStage.EligibleToApply]: [WorkflowStage.ApplicationStarted],
      [WorkflowStage.ApplicationStarted]: [WorkflowStage.DocumentsPending],
      [WorkflowStage.DocumentsPending]: [WorkflowStage.UnderReview],
      [WorkflowStage.UnderReview]: [WorkflowStage.Approved, WorkflowStage.Rejected],
      [WorkflowStage.Approved]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Suspended, WorkflowStage.Closed],
      [WorkflowStage.Suspended]: [WorkflowStage.Active, WorkflowStage.Closed],
      [WorkflowStage.Rejected]: [],
      [WorkflowStage.Closed]: [],
    },
  },

  // ---- Investing ----
  {
    id: 'investment',
    name: 'Investment Account',
    shortName: 'Investments',
    description: 'A managed investment account providing access to global markets and portfolios.',
    category: ProductCategory.Investing,
    icon: 'TrendingUp',

    status: ProductStatus.Available,

    eligibilityRequirements: {
      minAge: 18,
      minIncomeRequired: true,
      creditScoreMinimum: 0,
      residencyRequired: [],
      countriesSupported: ['US', 'CA', 'GB'],
      currenciesSupported: ['USD', 'CAD', 'GBP'],
    },

    approvalWorkflow: {
      stages: Object.values(WorkflowStage),
      requiresKYC: true,
      kycLevel: KYCLevel.Enhanced,
      requiredDocuments: ['government_id', 'proof_of_address', 'income_verification', 'risk_profile'],
      approvalTimeframe: '3–5 business days',
    },

    memberEntitlements: {
      permissions: [
        'view_balance', 'view_portfolio', 'place_trade',
        'view_statements', 'view_performance', 'manage_allocation',
      ],
      features: ['trading', 'portfolio_analytics', 'market_data', 'dividend_reinvestment'],
      limits: {
        dailyTransfer: 100000,
        monthlyTransactions: 200,
        balance_max: 10000000,
      },
    },

    navigation: {
      mainMenu: true,
      moreSection: false,
      menuLabel: 'Investments',
      route: '/investments',
      icon: 'TrendingUp',
    },

    dashboardWidgets: ['investments_summary', 'portfolio_performance', 'market_movers'],
    quickActions: ['buy_stock', 'sell_stock', 'view_portfolio', 'fund_account'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.EligibleToApply],
      [WorkflowStage.EligibleToApply]: [WorkflowStage.ApplicationStarted],
      [WorkflowStage.ApplicationStarted]: [WorkflowStage.DocumentsPending],
      [WorkflowStage.DocumentsPending]: [WorkflowStage.UnderReview],
      [WorkflowStage.UnderReview]: [WorkflowStage.AdditionalInfoRequired, WorkflowStage.Approved, WorkflowStage.Rejected],
      [WorkflowStage.AdditionalInfoRequired]: [WorkflowStage.UnderReview, WorkflowStage.Rejected],
      [WorkflowStage.Approved]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Suspended, WorkflowStage.Closed],
      [WorkflowStage.Suspended]: [WorkflowStage.Active, WorkflowStage.Closed],
      [WorkflowStage.Rejected]: [],
      [WorkflowStage.Closed]: [],
    },
  },

  {
    id: 'wealth_management',
    name: 'Wealth Management',
    shortName: 'Wealth',
    description: 'Personalized wealth planning, advisory services, and portfolio management for high-net-worth individuals.',
    category: ProductCategory.Investing,
    icon: 'Crown',

    status: ProductStatus.Available,

    eligibilityRequirements: {
      minAge: 21,
      minIncomeRequired: true,
      creditScoreMinimum: 0,
      residencyRequired: [],
      countriesSupported: ['US', 'CA', 'GB'],
      currenciesSupported: ['USD', 'CAD', 'GBP'],
    },

    approvalWorkflow: {
      stages: Object.values(WorkflowStage),
      requiresKYC: true,
      kycLevel: KYCLevel.Full,
      requiredDocuments: [
        'government_id', 'proof_of_address', 'income_verification',
        'net_worth_statement', 'investment_objectives',
      ],
      approvalTimeframe: '5–10 business days',
    },

    memberEntitlements: {
      permissions: [
        'view_balance', 'view_portfolio', 'view_advisory_reports',
        'place_trade', 'view_statements', 'access_advisor',
      ],
      features: ['dedicated_advisor', 'wealth_planning', 'estate_planning', 'tax_optimization'],
      limits: {
        dailyTransfer: 500000,
        monthlyTransactions: 500,
        balance_max: 100000000,
      },
    },

    navigation: {
      mainMenu: false,
      moreSection: true,
      menuLabel: 'Wealth Management',
      route: '/advisor',
      icon: 'Crown',
    },

    dashboardWidgets: ['wealth_summary', 'advisor_insights'],
    quickActions: ['book_advisor', 'view_portfolio'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.EligibleToApply],
      [WorkflowStage.EligibleToApply]: [WorkflowStage.ApplicationStarted],
      [WorkflowStage.ApplicationStarted]: [WorkflowStage.DocumentsPending],
      [WorkflowStage.DocumentsPending]: [WorkflowStage.UnderReview],
      [WorkflowStage.UnderReview]: [WorkflowStage.AdditionalInfoRequired, WorkflowStage.Approved, WorkflowStage.Rejected],
      [WorkflowStage.AdditionalInfoRequired]: [WorkflowStage.UnderReview, WorkflowStage.Rejected],
      [WorkflowStage.Approved]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Suspended, WorkflowStage.Closed],
      [WorkflowStage.Suspended]: [WorkflowStage.Active, WorkflowStage.Closed],
      [WorkflowStage.Rejected]: [],
      [WorkflowStage.Closed]: [],
    },
  },

  {
    id: 'crypto',
    name: 'Crypto / Digital Assets',
    shortName: 'Crypto',
    description: 'Buy, sell, and hold cryptocurrency and digital assets in a regulated environment.',
    category: ProductCategory.Investing,
    icon: 'Bitcoin',

    status: ProductStatus.ComingSoon,

    eligibilityRequirements: {
      minAge: 18,
      minIncomeRequired: false,
      creditScoreMinimum: 0,
      residencyRequired: [],
      countriesSupported: ['US', 'CA'],
      currenciesSupported: ['USD', 'CAD'],
    },

    approvalWorkflow: {
      stages: Object.values(WorkflowStage),
      requiresKYC: true,
      kycLevel: KYCLevel.Enhanced,
      requiredDocuments: ['government_id', 'proof_of_address', 'risk_disclosure_acknowledgment'],
      approvalTimeframe: '2–4 business days',
    },

    memberEntitlements: {
      permissions: ['view_balance', 'place_trade', 'view_portfolio', 'view_statements'],
      features: ['crypto_trading', 'digital_wallet', 'staking'],
      limits: {
        dailyTransfer: 50000,
        monthlyTransactions: 200,
        balance_max: 5000000,
      },
    },

    navigation: {
      mainMenu: false,
      moreSection: true,
      menuLabel: 'Crypto',
      route: '/trading',
      icon: 'Bitcoin',
    },

    dashboardWidgets: ['crypto_portfolio'],
    quickActions: ['buy_crypto', 'sell_crypto'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.EligibleToApply],
      [WorkflowStage.EligibleToApply]: [WorkflowStage.ApplicationStarted],
      [WorkflowStage.ApplicationStarted]: [WorkflowStage.DocumentsPending],
      [WorkflowStage.DocumentsPending]: [WorkflowStage.UnderReview],
      [WorkflowStage.UnderReview]: [WorkflowStage.Approved, WorkflowStage.Rejected],
      [WorkflowStage.Approved]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Suspended, WorkflowStage.Closed],
      [WorkflowStage.Suspended]: [WorkflowStage.Active, WorkflowStage.Closed],
      [WorkflowStage.Rejected]: [],
      [WorkflowStage.Closed]: [],
    },
  },

  // ---- Credit ----
  {
    id: 'credit_card',
    name: 'Credit Card',
    shortName: 'Credit Card',
    description: 'A premium Vantoris credit card with rewards, travel benefits, and fraud protection.',
    category: ProductCategory.Credit,
    icon: 'CreditCard',

    status: ProductStatus.Available,

    eligibilityRequirements: {
      minAge: 18,
      minIncomeRequired: true,
      creditScoreMinimum: 650,
      residencyRequired: ['US'],
      countriesSupported: ['US'],
      currenciesSupported: ['USD'],
    },

    approvalWorkflow: {
      stages: Object.values(WorkflowStage),
      requiresKYC: true,
      kycLevel: KYCLevel.Enhanced,
      requiredDocuments: ['government_id', 'proof_of_address', 'income_verification'],
      approvalTimeframe: '3–5 business days',
    },

    memberEntitlements: {
      permissions: [
        'view_balance', 'make_payment', 'view_statements',
        'manage_card', 'view_rewards',
      ],
      features: ['rewards_program', 'travel_insurance', 'purchase_protection', 'contactless'],
      limits: {
        dailyTransfer: 5000,
        monthlyTransactions: 500,
        balance_max: 50000,
      },
    },

    navigation: {
      mainMenu: false,
      moreSection: true,
      menuLabel: 'Credit Card',
      route: '/services',
      icon: 'CreditCard',
    },

    dashboardWidgets: ['credit_card_summary', 'rewards_balance'],
    quickActions: ['pay_bill', 'view_rewards', 'manage_card'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.EligibleToApply],
      [WorkflowStage.EligibleToApply]: [WorkflowStage.ApplicationStarted],
      [WorkflowStage.ApplicationStarted]: [WorkflowStage.DocumentsPending],
      [WorkflowStage.DocumentsPending]: [WorkflowStage.UnderReview],
      [WorkflowStage.UnderReview]: [WorkflowStage.AdditionalInfoRequired, WorkflowStage.Approved, WorkflowStage.Rejected],
      [WorkflowStage.AdditionalInfoRequired]: [WorkflowStage.UnderReview, WorkflowStage.Rejected],
      [WorkflowStage.Approved]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Suspended, WorkflowStage.Closed],
      [WorkflowStage.Suspended]: [WorkflowStage.Active, WorkflowStage.Closed],
      [WorkflowStage.Rejected]: [],
      [WorkflowStage.Closed]: [],
    },
  },

  {
    id: 'personal_loan',
    name: 'Personal Loan',
    shortName: 'Personal Loan',
    description: 'Fixed-rate personal loans for major purchases, debt consolidation, and life events.',
    category: ProductCategory.Credit,
    icon: 'Banknote',

    status: ProductStatus.Available,

    eligibilityRequirements: {
      minAge: 18,
      minIncomeRequired: true,
      creditScoreMinimum: 620,
      residencyRequired: ['US'],
      countriesSupported: ['US'],
      currenciesSupported: ['USD'],
    },

    approvalWorkflow: {
      stages: Object.values(WorkflowStage),
      requiresKYC: true,
      kycLevel: KYCLevel.Enhanced,
      requiredDocuments: ['government_id', 'proof_of_address', 'income_verification', 'bank_statements'],
      approvalTimeframe: '1–3 business days',
    },

    memberEntitlements: {
      permissions: ['view_balance', 'make_payment', 'view_statements', 'view_schedule'],
      features: ['amortization_schedule', 'early_payoff', 'auto_pay'],
      limits: {
        dailyTransfer: 0,
        monthlyTransactions: 12,
        balance_max: 100000,
      },
    },

    navigation: {
      mainMenu: false,
      moreSection: true,
      menuLabel: 'Personal Loan',
      route: '/services',
      icon: 'Banknote',
    },

    dashboardWidgets: ['loan_summary'],
    quickActions: ['make_loan_payment'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.EligibleToApply],
      [WorkflowStage.EligibleToApply]: [WorkflowStage.ApplicationStarted],
      [WorkflowStage.ApplicationStarted]: [WorkflowStage.DocumentsPending],
      [WorkflowStage.DocumentsPending]: [WorkflowStage.UnderReview],
      [WorkflowStage.UnderReview]: [WorkflowStage.AdditionalInfoRequired, WorkflowStage.Approved, WorkflowStage.Rejected],
      [WorkflowStage.AdditionalInfoRequired]: [WorkflowStage.UnderReview, WorkflowStage.Rejected],
      [WorkflowStage.Approved]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Closed],
      [WorkflowStage.Rejected]: [],
      [WorkflowStage.Closed]: [],
    },
  },

  // ---- Services ----
  {
    id: 'business_account',
    name: 'Business Account',
    shortName: 'Business',
    description: 'Full-featured business banking for entrepreneurs and companies of all sizes.',
    category: ProductCategory.Services,
    icon: 'Briefcase',

    status: ProductStatus.Available,

    eligibilityRequirements: {
      minAge: 18,
      minIncomeRequired: false,
      creditScoreMinimum: 0,
      residencyRequired: [],
      countriesSupported: ['US', 'CA', 'GB'],
      currenciesSupported: ['USD', 'CAD', 'GBP'],
    },

    approvalWorkflow: {
      stages: Object.values(WorkflowStage),
      requiresKYC: true,
      kycLevel: KYCLevel.Full,
      requiredDocuments: [
        'government_id', 'proof_of_address', 'business_registration',
        'articles_of_incorporation', 'beneficial_ownership',
      ],
      approvalTimeframe: '5–7 business days',
    },

    memberEntitlements: {
      permissions: [
        'view_balance', 'make_transfer', 'view_statements',
        'deposit_funds', 'withdraw_funds', 'manage_payroll',
      ],
      features: ['multi_user_access', 'payroll', 'invoicing', 'expense_tracking', 'api_access'],
      limits: {
        dailyTransfer: 250000,
        monthlyTransactions: 5000,
        balance_max: 10000000,
      },
    },

    navigation: {
      mainMenu: false,
      moreSection: true,
      menuLabel: 'Business Account',
      route: '/accounts',
      icon: 'Briefcase',
    },

    dashboardWidgets: ['business_summary', 'cash_flow'],
    quickActions: ['transfer', 'pay_vendor', 'deposit'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.EligibleToApply],
      [WorkflowStage.EligibleToApply]: [WorkflowStage.ApplicationStarted],
      [WorkflowStage.ApplicationStarted]: [WorkflowStage.DocumentsPending],
      [WorkflowStage.DocumentsPending]: [WorkflowStage.UnderReview],
      [WorkflowStage.UnderReview]: [WorkflowStage.AdditionalInfoRequired, WorkflowStage.Approved, WorkflowStage.Rejected],
      [WorkflowStage.AdditionalInfoRequired]: [WorkflowStage.UnderReview, WorkflowStage.Rejected],
      [WorkflowStage.Approved]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Suspended, WorkflowStage.Closed],
      [WorkflowStage.Suspended]: [WorkflowStage.Active, WorkflowStage.Closed],
      [WorkflowStage.Rejected]: [],
      [WorkflowStage.Closed]: [],
    },
  },

  // ---- Impact ----
  {
    id: 'herobox',
    name: 'HeroBox',
    shortName: 'HeroBox',
    description: 'Support military heroes, first responders, and disaster relief through curated care packages and direct impact giving.',
    category: ProductCategory.Impact,
    icon: 'Heart',

    status: ProductStatus.Available,

    eligibilityRequirements: {
      minAge: 0,
      minIncomeRequired: false,
      creditScoreMinimum: 0,
      residencyRequired: [],
      countriesSupported: [],
      currenciesSupported: ['USD'],
    },

    approvalWorkflow: {
      stages: [
        WorkflowStage.NotApplied,
        WorkflowStage.Active,
        WorkflowStage.Closed,
      ],
      requiresKYC: false,
      kycLevel: KYCLevel.Basic,
      requiredDocuments: [],
      approvalTimeframe: 'Immediate',
    },

    memberEntitlements: {
      permissions: ['view_herobox', 'donate', 'send_care_package', 'view_impact'],
      features: ['care_packages', 'impact_tracking', 'social_sharing', 'causes'],
      limits: {
        dailyTransfer: 10000,
        monthlyTransactions: 100,
        balance_max: 0,
      },
    },

    navigation: {
      mainMenu: true,
      moreSection: false,
      menuLabel: 'HeroBox',
      route: '/herobox',
      icon: 'Heart',
    },

    dashboardWidgets: ['herobox_impact', 'herobox_activity'],
    quickActions: ['donate', 'send_care_package'],

    workflowTransitions: {
      [WorkflowStage.NotApplied]: [WorkflowStage.Active],
      [WorkflowStage.Active]: [WorkflowStage.Closed],
      [WorkflowStage.Closed]: [],
    },
  },
];

// ---- Catalog Lookup Helpers ----

const catalogById = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

/**
 * Get every product in the catalog.
 * @returns {object[]}
 */
export function getAllProducts() {
  return PRODUCTS;
}

/**
 * Get a single product by its ID.
 * @param {string} id
 * @returns {object|null}
 */
export function getProductById(id) {
  return catalogById[id] ?? null;
}

/**
 * Get all products in a given category.
 * @param {string} category  One of ProductCategory values.
 * @returns {object[]}
 */
export function getProductsByCategory(category) {
  return PRODUCTS.filter(p => p.category === category);
}

/**
 * Get all products that are currently available (not disabled or legacy).
 * @returns {object[]}
 */
export function getAvailableProducts() {
  return PRODUCTS.filter(
    p => p.status === ProductStatus.Available || p.status === ProductStatus.ComingSoon,
  );
}

export default PRODUCTS;
