export function isProviderBackedAccount(account = {}) {
  return account.provider === 'unit' && Boolean(account.provider_account_id);
}

export function providerStatus(account = {}) {
  return isProviderBackedAccount(account) ? 'connected' : 'unavailable';
}

export function formatProviderUnavailable() {
  return 'Live banking provider is not connected. No financial action was simulated.';
}
