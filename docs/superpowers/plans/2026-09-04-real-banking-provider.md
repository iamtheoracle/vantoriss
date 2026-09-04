# Real Banking Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fabricated internal banking identifiers and simulated payment outcomes with a fail-closed Unit-backed banking integration while preserving Vantoris's existing member UX.

**Architecture:** Base44 backend functions are the only provider boundary. Unit is the primary provider for live banking accounts, balances, transactions, payments, and cards; local entities store provider references and synchronized state. Zelle remains separate and cannot be represented as live settlement without an actual Zelle financial-institution relationship.

**Tech Stack:** React, Base44 SDK, Base44 backend functions, TypeScript/Deno, Unit REST API, Base44 entities.

**Spec:** `docs/superpowers/specs/2026-09-04-real-banking-provider-design.md`

## Global Constraints

- No fake/demo financial data in production UX.
- No sandbox data presented as live.
- Provider credentials remain server-side secrets.
- Missing live credentials fail closed.
- Provider confirmation is required before local records report success.
- Netlify deployment is not triggered.

---

### Task 1: Establish provider-backed account primitives

**Files:**
- Create: `base44/functions/unitBanking/entry.ts`
- Create: `src/lib/unitBanking.js`
- Test: `scripts/test-unit-banking.mjs`

**Interfaces:**
- `unitBanking.js` exports `providerStatus`, `isProviderBackedAccount`, and `formatProviderUnavailable`.
- Backend function accepts `{ action, ...payload }` and returns JSON with `success`, `provider`, and action-specific fields.

- [ ] **Step 1: Write failing pure helper tests**

```js
import assert from 'node:assert/strict';
import { isProviderBackedAccount, providerStatus, formatProviderUnavailable } from '../src/lib/unitBanking.js';

assert.equal(isProviderBackedAccount({ provider: 'unit', provider_account_id: 'acc_123' }), true);
assert.equal(isProviderBackedAccount({ provider: 'unit', provider_account_id: '' }), false);
assert.equal(providerStatus({ provider: 'unit', provider_account_id: 'acc_123' }), 'connected');
assert.equal(providerStatus({}), 'unavailable');
assert.match(formatProviderUnavailable(), /live banking provider/i);
console.log('unit banking helper tests passed');
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `node scripts/test-unit-banking.mjs`
Expected: FAIL because `src/lib/unitBanking.js` does not yet exist.

- [ ] **Step 3: Implement the pure helper**

```js
export function isProviderBackedAccount(account = {}) {
  return account.provider === 'unit' && Boolean(account.provider_account_id);
}

export function providerStatus(account = {}) {
  return isProviderBackedAccount(account) ? 'connected' : 'unavailable';
}

export function formatProviderUnavailable() {
  return 'Live banking provider is not connected. No financial action was simulated.';
}
```

- [ ] **Step 4: Implement the backend provider boundary**

The function must read `UNIT_API_TOKEN` and `UNIT_API_BASE_URL` only from server environment. Default the base URL to Unit Live only when a live token exists; otherwise return HTTP 503 with an explicit provider-unavailable response. Supported actions are `create_customer`, `create_deposit_account`, `get_account`, `get_account_balance`, `list_transactions`, and `create_payment`. Every provider request must use HTTPS, the bearer token, JSON headers, and an idempotency key for money movement. Never return the token or full bank credentials.

- [ ] **Step 5: Run the pure tests**

Run: `node scripts/test-unit-banking.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/unitBanking.js base44/functions/unitBanking/entry.ts scripts/test-unit-banking.mjs
git commit -m "feat: add Unit banking provider boundary"
```

---

### Task 2: Stop generating fake bank accounts

**Files:**
- Modify: `base44/functions/generateAccount/entry.ts`
- Modify: relevant Account entity schema if provider fields are absent

**Interfaces:**
- Existing `generateAccount` remains callable by current workflows but delegates account creation to the Unit provider boundary.
- A created live account must contain `provider: 'unit'`, `provider_account_id`, and provider-issued account/routing information.

- [ ] **Step 1: Remove arbitrary account-number generation and fixed routing-number assignment.**

- [ ] **Step 2: Require a live Unit credential before attempting creation.**

- [ ] **Step 3: Create or resolve the Unit customer for the authenticated/target user, then create a Unit deposit account.**

- [ ] **Step 4: Persist only confirmed provider-issued account metadata locally.**

- [ ] **Step 5: Return provider confirmation fields only after the Unit API confirms creation.**

- [ ] **Step 6: Verify failure behavior with missing credentials.**

Expected: HTTP 503/provider-unavailable; no local Account is created.

- [ ] **Step 7: Commit**

```bash
git add base44/functions/generateAccount/entry.ts
 git commit -m "fix: require real provider for account creation"
```

---

### Task 3: Make member balances and account details provider-backed

**Files:**
- Modify: `src/pages/MoveMoney.jsx`
- Modify: `src/pages/Accounts.jsx`
- Modify: relevant Account entity schema

**Interfaces:**
- Member UI continues consuming Account records but only displays live financial balances when the record has a provider reference and synchronized provider state.
- Unbacked records show an explicit unavailable/legacy state rather than a bank balance.

- [ ] **Step 1: Add provider-backed filtering/state checks.**

- [ ] **Step 2: Stop treating missing provider metadata as a live account.**

- [ ] **Step 3: Surface explicit unavailable state for legacy/unbacked accounts.**

- [ ] **Step 4: Preserve the existing Accounts navigation and phone UI.**

- [ ] **Step 5: Verify no hardcoded routing number, balance, or success state remains in the member flow.**

- [ ] **Step 6: Commit**

```bash
git add src/pages/MoveMoney.jsx src/pages/Accounts.jsx
 git commit -m "fix: show only provider-backed banking state"
```

---

### Task 4: Replace simulated Zelle success messaging

**Files:**
- Modify: `src/pages/MoveMoney.jsx`
- Modify: `src/lib/zelle.js`

**Interfaces:**
- `findZelleRecipient` continues to return only genuinely enrolled local Zelle profiles.
- Zelle send/request actions must never create a notification implying that money was sent when no real Zelle settlement provider is connected.

- [ ] **Step 1: Replace the current notification-only send behavior with a provider-unavailable response.**

- [ ] **Step 2: Keep recipient verification and QR identification, but label settlement as unavailable until a real Zelle network relationship exists.**

- [ ] **Step 3: Ensure QR payload never contains email, phone, bank account, or routing data.**

- [ ] **Step 4: Add pure regression tests for the no-settlement behavior.**

- [ ] **Step 5: Commit**

```bash
git add src/pages/MoveMoney.jsx src/lib/zelle.js scripts/test-zelle.mjs
 git commit -m "fix: prevent simulated Zelle settlement"
```

---

### Task 5: Add live-provider configuration documentation

**Files:**
- Create: `docs/integrations/unit-production.md`

**Interfaces:**
- Documents the exact secrets and provider onboarding prerequisites without storing credentials.

- [ ] **Step 1: Document required server secrets:** `UNIT_API_TOKEN`, optional `UNIT_API_BASE_URL`, and any webhook verification secret required by the deployed Base44 function environment.

- [ ] **Step 2: Document that production access requires a Unit live account/program approval and that sandbox credentials must never be configured as production.**

- [ ] **Step 3: Document Zelle as a separate network-partnership requirement.**

- [ ] **Step 4: Commit**

```bash
git add docs/integrations/unit-production.md
git commit -m "docs: define live Unit configuration"
```

---

### Task 6: Verify repository state

**Files:**
- No source changes.

- [ ] **Step 1: Run pure helper tests**

Run: `node scripts/test-unit-banking.mjs && node scripts/test-zelle.mjs`
Expected: both exit 0.

- [ ] **Step 2: Search for the removed fake banking constants**

Run: `git grep -n "021000021\|Math\.random.*account\|Account Number.*generated" -- ':!docs/superpowers/*'`
Expected: no production matches.

- [ ] **Step 3: Compare the feature branch with main**

Run: `git diff main...feat/real-banking-provider --stat`
Expected: only the documented provider-integration changes are present.

- [ ] **Step 4: Confirm no Netlify deployment was triggered.**

- [ ] **Step 5: Report the remaining external prerequisite precisely:** a live Unit production account/token and approved banking program are required before Vantoris can make real live provider calls. Do not claim live connectivity until an actual authenticated live API call succeeds.
