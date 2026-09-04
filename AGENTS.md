# AGENTS.md

## Project Context

This is a Base44 app repository for Vantoris Private Investment & Payments. Treat it as user-owned production application code. Keep changes focused, preserve existing conventions, and do not introduce demo shortcuts that contradict production architecture.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Vantoris Source of Truth

Read and follow `docs/VANTORIS_OPERATING_DOCTRINE.md` before making changes that affect agents, banking, payments, investment, Discovery, HeroBox, authentication, RBAC, or financial state.

The core rules are:

1. No fake data. Never fabricate real balances, accounts, cards, transactions, investments, provider results, news, users, humanitarian cases, products, prices, or successful actions.
2. Demonstration data is allowed only as explicitly labelled demonstration/simulation experience data and can never represent spendable or provider-backed funds.
3. Provider-backed records are authoritative for live financial state. Unit is the intended real banking provider integration. Do not invent production routing/account numbers.
4. A recommendation is not authorization; authorization is not execution; execution is not verified completion until the underlying service/provider confirms it.
5. Member accounts and staff/operator identities are separate. Staff do not automatically receive member access. A staff member wanting a personal membership must open it separately.
6. Operator intelligence is role-aware. Use authenticated role, department, position, OperationalProfile, capabilities, and permitted Command divisions. Never infer authorization from a title alone.
7. Vantoris Command coordinates specialist divisions and invokes the minimum necessary capability. Do not automatically invoke every agent and never let one specialist override another domain.
8. Discovery is intelligence, not authorization. Current information must be sourced, timestamped/freshness-aware, deduplicated, corroborated, and clearly distinguished between confirmed and developing information.
9. Sensitive financial, security, destructive, irreversible, administrative, KYC, compliance, and payment actions require the appropriate authorization, confirmation, provider checks, and audit trail.
10. If a provider, integration, worker, or capability is unavailable, return an explicit unavailable/pending/requires-authorization/requires-human-review/failed state. Do not simulate success.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.
- `base44/agents/`: Command and specialist agent definitions.
- `base44/functions/`: backend/provider execution paths.
- `docs/VANTORIS_OPERATING_DOCTRINE.md`: authoritative engineering/agent doctrine.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.
- Do not deploy to Netlify unless the user explicitly requests deployment.
- Preserve the distinction between code verification and production verification; never claim a full build or live provider test without actually running it.
