// ============================================================
// VANTORIS — Super Administrator Exception Authentication
// ============================================================
// Authorizes actions that are EXCLUSIVE to the Super Administrator
// and outside the normal capabilities of Management, Support,
// HeroBox, and Investment administrators.
//
// SECURITY MODEL:
// - The raw secret is stored via set_secrets (SUPER_ADMIN_EXCEPTION_SECRET)
//   and is only accessible to backend functions via process.env.
// - Validation is performed SERVER-SIDE by the 'validateExceptionAuth'
//   backend function, which compares the submitted credential against
//   the stored secret and returns only a safe result:
//     EXCEPTION_AUTHORIZATION_VALID
//     EXCEPTION_AUTHORIZATION_FAILED
// - The raw secret NEVER enters the LLM context, chat history, UI,
//   logs, or error messages.
// - The frontend collects the credential, sends it to the backend,
//   and immediately clears it from memory.
//
// BACKEND REQUIREMENT (Builder+):
// The 'validateExceptionAuth' backend function must be created to
// enable server-side validation. Until then, this module reports
// a truthful 'backend unavailable' state — it NEVER grants
// authorization via frontend-only logic.
// ============================================================

import { base44 } from '@/api/base44Client';
import { isSuperAdmin } from './operationsAccess';

// ---- Super Administrator-Exclusive Actions ----
// These are outside the normal capabilities of ALL other admin domains.
// Only the authenticated Super Administrator may perform them, and only
// after successful Exception Authentication.
export const SUPER_ADMIN_EXCLUSIVE_ACTIONS = {
  // System / Application Control
  edit_core_functionality: 'Edit core application functionality',
  modify_production_behavior: 'Modify production application behavior',
  change_protected_config: 'Change protected system configuration',
  change_db_schema: 'Change database architecture/schema',
  add_remove_system_functionality: 'Add or remove major system functionality',
  change_core_workflows: 'Change core application workflows',

  // API / Integrations
  add_api: 'Add an API',
  remove_api: 'Remove an API',
  modify_api_config: 'Modify API configuration',
  add_remove_provider: 'Add or remove external providers',
  change_api_credentials: 'Change protected API credentials',
  change_integration_architecture: 'Change core integration architecture',

  // LLM / AI Configuration
  change_llm_provider: 'Change the underlying LLM or provider',
  change_ai_config: 'Change protected AI configuration',
  change_assistant_config: 'Change Vantoris Assistant system configuration',
  change_command_routing: 'Change Command routing architecture',
  add_remove_division: 'Add or remove Command divisions',
  change_division_capabilities: 'Materially change Command division capabilities',
  change_assistant_instructions: 'Change protected Assistant instructions',

  // Administration
  change_role_definitions: 'Change administrator role definitions',
  change_admin_capabilities: 'Change administrator capabilities',
  grant_outside_domain: "Grant capabilities outside an administrator's normal domain",
  remove_protected_privileges: 'Remove protected administrator privileges',
  create_privileged_roles: 'Create or modify privileged administrator roles',
  disable_admin_beyond_normal: 'Disable or remove another administrator where ordinary permissions do not allow it',
  change_super_admin_config: 'Change the Super Administrator configuration',

  // Security / Authorization Architecture
  change_auth_architecture: 'Change authentication architecture',
  change_authorization_architecture: 'Change authorization architecture',
  change_security_rules: 'Change protected security rules',
  change_access_control: 'Change system-wide access-control policies',
  modify_super_admin_security: 'Modify the Super Administrator security model',

  // System Data / Control
  modify_protected_config: 'Modify protected system-wide configuration',
  destructive_system_modification: 'Perform destructive system-level modifications',
  change_protected_records: 'Change protected historical or system records where ordinary permissions do not allow it',
  emergency_system_control: 'Emergency system-control operations classified as Super Administrator-exclusive',
};

// Check if an action requires Exception Authentication
export function requiresExceptionAuth(action) {
  return Object.prototype.hasOwnProperty.call(SUPER_ADMIN_EXCLUSIVE_ACTIONS, action);
}

// Get the human-readable label for an exclusive action
export function getActionLabel(action) {
  return SUPER_ADMIN_EXCLUSIVE_ACTIONS[action] || action;
}

// ---- Rate Limiting (frontend first line; real enforcement is server-side) ----
const RATE_LIMIT_KEY = 'vantoris_exc_auth_rl';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getRateLimitState() {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function setRateLimitState(state) {
  try {
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable — fail silently
  }
}

export function isLockedOut() {
  const state = getRateLimitState();
  return state.lockedUntil > Date.now();
}

export function getLockoutRemaining() {
  const state = getRateLimitState();
  return Math.max(0, state.lockedUntil - Date.now());
}

function recordFailedAttempt() {
  const state = getRateLimitState();
  state.attempts += 1;
  if (state.attempts >= MAX_ATTEMPTS) {
    state.lockedUntil = Date.now() + LOCKOUT_DURATION;
    state.attempts = 0;
  }
  setRateLimitState(state);
}

function resetRateLimit() {
  setRateLimitState({ attempts: 0, lockedUntil: 0 });
}

// ---- Authorization Grants (in-memory only, never persisted to browser storage) ----
const activeGrants = new Map();
const GRANT_DURATION = 5 * 60 * 1000; // 5 minutes

function createGrant(action, target) {
  const grantId = `grant_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const grant = {
    id: grantId,
    action,
    target: target || '*',
    issuedAt: Date.now(),
    expiresAt: Date.now() + GRANT_DURATION,
    used: false,
  };
  activeGrants.set(grantId, grant);
  return grant;
}

// Validate a grant for a specific action + target
// An authorization for "Add API provider X" must NOT authorize "Change admin permissions"
export function validateGrant(grantId, action, target) {
  const grant = activeGrants.get(grantId);
  if (!grant) return { valid: false, reason: 'Grant not found' };
  if (grant.used) return { valid: false, reason: 'Grant already used' };
  if (Date.now() > grant.expiresAt) {
    activeGrants.delete(grantId);
    return { valid: false, reason: 'Grant expired' };
  }
  if (grant.action !== action) return { valid: false, reason: 'Action mismatch — grant is action-specific' };
  if (grant.target !== '*' && grant.target !== target) {
    return { valid: false, reason: 'Target mismatch — grant is resource-specific' };
  }
  return { valid: true, grant };
}

// Consume (invalidate) a grant after the authorized action is executed
export function consumeGrant(grantId) {
  const grant = activeGrants.get(grantId);
  if (grant) {
    grant.used = true;
    activeGrants.delete(grantId);
  }
}

// Clean up expired grants
function cleanupGrants() {
  const now = Date.now();
  for (const [id, grant] of activeGrants) {
    if (now > grant.expiresAt || grant.used) {
      activeGrants.delete(id);
    }
  }
}

// ---- Core: Request Exception Authentication ----
// Sends the credential to the backend 'validateExceptionAuth' function.
// The backend validates against process.env.SUPER_ADMIN_EXCEPTION_SECRET
// and returns only a safe result. The raw secret never enters the LLM.
//
// Returns: { success, result, grant?, reason?, backendUnavailable? }
export async function requestExceptionAuth(user, action, target, credential) {
  // 1. Verify the user is the Super Administrator
  if (!isSuperAdmin(user)) {
    return {
      success: false,
      result: 'EXCEPTION_AUTHORIZATION_FAILED',
      reason: 'User is not the Super Administrator',
    };
  }

  // 2. Verify the action requires exception auth
  if (!requiresExceptionAuth(action)) {
    return {
      success: false,
      result: 'EXCEPTION_AUTHORIZATION_FAILED',
      reason: 'Action does not require Exception Authentication',
    };
  }

  // 3. Check rate limiting
  if (isLockedOut()) {
    const remaining = getLockoutRemaining();
    return {
      success: false,
      result: 'EXCEPTION_AUTHORIZATION_FAILED',
      reason: `Temporarily locked out. Try again in ${Math.ceil(remaining / 60000)} minute(s).`,
    };
  }

  // 4. Call the backend validation function
  // The credential is sent to the backend, validated against the secret
  // stored in process.env.SUPER_ADMIN_EXCEPTION_SECRET, and only a safe
  // result is returned. The raw secret never leaves the backend.
  try {
    const response = await base44.functions.invoke('validateExceptionAuth', {
      action,
      target: target || '*',
      credential,
    });

    if (response && response.result === 'EXCEPTION_AUTHORIZATION_VALID') {
      resetRateLimit();
      const grant = createGrant(action, target);
      cleanupGrants();
      return { success: true, result: 'EXCEPTION_AUTHORIZATION_VALID', grant };
    } else {
      recordFailedAttempt();
      return {
        success: false,
        result: 'EXCEPTION_AUTHORIZATION_FAILED',
        reason: 'Invalid credential',
      };
    }
  } catch (error) {
    // Backend function unavailable (Builder+ required)
    // Do NOT grant authorization via frontend-only logic.
    recordFailedAttempt();
    return {
      success: false,
      result: 'EXCEPTION_AUTHORIZATION_FAILED',
      reason: 'Server-side validation unavailable. Backend function required (Builder+).',
      backendUnavailable: true,
    };
  }
}

// ---- Audit Logging ----
// Records the exception auth event to the AuditLog entity.
// NEVER records the actual credential/secret.
export async function logExceptionAuthEvent(user, action, target, result, executionResult) {
  try {
    await base44.entities.AuditLog.create({
      action_type: 'super_admin_exception_auth',
      user_id: user?.id || '',
      admin_name: user?.full_name || user?.email || '',
      description: `Super Administrator Exception Authentication: ${getActionLabel(action)}`,
      details: JSON.stringify({
        action,
        action_label: getActionLabel(action),
        target: target || '*',
        result, // EXCEPTION_AUTHORIZATION_VALID or EXCEPTION_AUTHORIZATION_FAILED
        execution_result: executionResult || null,
        timestamp: new Date().toISOString(),
        // NEVER includes the credential/secret
      }),
    });
  } catch (e) {
    // Audit logging failure should not block the flow, but should be reported
    console.warn('Exception auth audit log write failed:', e?.message || e);
  }
}