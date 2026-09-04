const LIVE_UNIT_BASE_URL = 'https://api.unit.co';

export function getUnitConfig() {
  const token = Deno.env.get('UNIT_API_TOKEN') || '';
  const baseUrl = (Deno.env.get('UNIT_API_BASE_URL') || LIVE_UNIT_BASE_URL).replace(/\/$/, '');
  return { token, baseUrl };
}

export function requireUnitConfig() {
  const config = getUnitConfig();
  if (!config.token) {
    const error = new Error('Live banking provider is not configured. No financial action was simulated.');
    error.code = 'UNIT_NOT_CONFIGURED';
    error.status = 503;
    throw error;
  }
  if (!config.baseUrl.startsWith('https://')) {
    const error = new Error('Unit API endpoint must use HTTPS.');
    error.code = 'UNIT_INVALID_ENDPOINT';
    error.status = 500;
    throw error;
  }
  return config;
}

export async function unitRequest(path, { method = 'GET', body, idempotencyKey } = {}) {
  const { token, baseUrl } = requireUnitConfig();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) {
    const error = new Error(data?.errors?.[0]?.detail || data?.error || `Unit API request failed (${response.status})`);
    error.status = response.status;
    error.providerResponse = data;
    throw error;
  }
  return data;
}

export function extractResource(response) {
  return response?.data || null;
}

export function resourceAttributes(resource) {
  return resource?.attributes || {};
}
