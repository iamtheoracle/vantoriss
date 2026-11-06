/**
 * Server-only model gateway for AVA and the Oracle runtime.
 * Provider credentials are read only from backend environment variables.
 * Base44 InvokeLLM remains available as a named compatibility provider.
 */
function readEnv(name) {
  try { return Deno.env.get(name) || ''; } catch { return ''; }
}

function safeEndpoint(raw) {
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const localDevelopment = readEnv('AVCU_ENVIRONMENT') === 'development'
      && ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && localDevelopment)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function extractText(payload) {
  if (typeof payload?.text === 'string') return payload.text;
  if (typeof payload?.response === 'string') return payload.response;
  if (typeof payload?.choices?.[0]?.message?.content === 'string') return payload.choices[0].message.content;
  if (typeof payload?.choices?.[0]?.text === 'string') return payload.choices[0].text;
  return '';
}

function parseStructured(text) {
  const raw = String(text || '').trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '');
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Model gateway returned invalid structured JSON'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Model gateway returned an invalid structured response');
  if (typeof parsed.response !== 'string' || !parsed.response.trim()) throw new Error('Structured response is missing its member-facing response');
  return { ...parsed, response: parsed.response.trim() };
}

export function createModelGateway(base44) {
  const endpoint = safeEndpoint(readEnv('AVCU_MODEL_GATEWAY_URL') || readEnv('AVCU_AI_GATEWAY_URL'));
  const apiKey = readEnv('AVCU_MODEL_GATEWAY_API_KEY');
  const configuredModel = readEnv('AVCU_MODEL_GATEWAY_MODEL') || 'default';
  const fallbackEnabled = readEnv('AVCU_LEGACY_LLM_FALLBACK') !== 'false';

  async function invokeGateway({ prompt, model, responseJsonSchema }) {
    if (!endpoint || !apiKey) throw new Error('AVCU model gateway is not configured');
    const instruction = responseJsonSchema
      ? '\n\nReturn only valid JSON matching this schema:\n' + JSON.stringify(responseJsonSchema)
      : '';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        model: model && model !== 'automatic' ? model : configuredModel,
        messages: [{ role: 'user', content: String(prompt || '') + instruction }],
        response_format: responseJsonSchema ? { type: 'json_object' } : undefined,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `Model gateway HTTP ${response.status}`);
    const text = extractText(payload);
    if (!text.trim()) throw new Error('Model gateway returned an empty response');
    return responseJsonSchema ? parseStructured(text) : text;
  }

  async function invokeLegacy({ prompt, model = 'automatic', responseJsonSchema, addContextFromInternet, fileUrls }) {
    const params = { prompt, model };
    if (responseJsonSchema) params.response_json_schema = responseJsonSchema;
    if (addContextFromInternet) params.add_context_from_internet = true;
    if (fileUrls) params.file_urls = fileUrls;
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM(params);
    if (responseJsonSchema) return result;
    return result.response || result.result || result;
  }

  return {
    async invoke(params) {
      if (endpoint && apiKey) {
        try {
          return await invokeGateway(params);
        } catch (error) {
          if (!fallbackEnabled) throw error;
          console.warn('AVCU model gateway failed; using retained compatibility provider', { reason: error?.message || 'unknown' });
        }
      }
      return invokeLegacy(params);
    },
    invokeLegacy,
    status() {
      return {
        primary: endpoint && apiKey ? 'configured_unverified' : 'not_configured',
        compatibilityProvider: 'available_unverified',
        fallbackEnabled,
      };
    },
  };
}
