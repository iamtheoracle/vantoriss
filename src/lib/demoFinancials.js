const DEMO_ACCOUNT = {
  id: 'demo-account-checking',
  provider: 'demonstration',
  provider_status: 'demonstration',
  account_name: 'Vantoris Everyday Account',
  account_type: 'checking',
  account_number: '0000004821',
  routing_number: '000000000',
  available_balance: 12480,
  balance: 12480,
  currency: 'USD',
};

const DEMO_CARD = {
  id: 'demo-card-primary',
  provider: 'demonstration',
  provider_status: 'demonstration',
  provider_card_id: 'demo-card-primary',
  last4: '4821',
  cardholder_name: 'VANTORIS MEMBER',
  card_type: 'debit',
  status: 'active',
};

const DEMO_PORTFOLIO = {
  id: 'demo-portfolio',
  provider: 'demonstration',
  provider_status: 'demonstration',
  provider_portfolio_id: 'demo-portfolio',
  name: 'Vantoris Portfolio',
  total_value: 38750,
};

export function isDemoFinancialRecord(record = {}) {
  return record.provider === 'demonstration';
}

export function buildDemoFinancialState(user = {}) {
  const name = user.full_name || 'Vantoris Member';
  return {
    mode: 'demonstration',
    label: 'Demonstration experience',
    notice: 'These figures demonstrate the Vantoris experience. They are not real funds and cannot be spent, withdrawn, transferred, or invested.',
    accounts: [{ ...DEMO_ACCOUNT, user_id: user.id, account_name: `${name.split(/\s+/)[0]}'s Vantoris Account` }],
    cards: [{ ...DEMO_CARD, user_id: user.id, cardholder_name: name.toUpperCase() }],
    portfolios: [{ ...DEMO_PORTFOLIO, user_id: user.id }],
  };
}
