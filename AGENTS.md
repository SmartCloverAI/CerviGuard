# CerviGuard Agent Operating Memory

This file is the durable operating memory for all future agents working in this repository.
It is both:
- an execution protocol (`how to work`), and
- an append-only memory ledger (`what has been learned/changed`).

If instructions elsewhere conflict with this file, follow the stricter safety/quality rule and document the conflict in the memory ledger.

## 1) Non-Negotiable Workflow

For every task, execute in this order:
1. **Load Context**: inspect relevant code/docs before changing anything.
2. **Build (Primary Role)**: implement the smallest correct change.
3. **Adversarial Check (CRITIC Role, required)**: take the radical reverse role and attempt to break your own change.
4. **Refine (BUILDER Role, required)**: apply fixes/improvements from the critic phase.
5. **Verify**: run the narrowest meaningful checks and confirm behavior.
6. **Append Memory**: if any important discovery/change/insight occurred, append a ledger entry.

No modification is complete until steps 3 and 4 are done.

## 2) Mandatory Adversarial Check Protocol

After every modification (code, docs, config), explicitly run:

### Phase A: BUILDER
- State what was changed and why.
- State assumptions and expected behavior.

### Phase B: CRITIC (Radical Reverse Role)
- Assume the modification is flawed.
- Probe for:
  - correctness regressions,
  - security/privacy risks,
  - data loss or auth/access-control issues,
  - operational risk (timeouts, env/config mismatch),
  - maintainability and clarity failures,
  - documentation drift from actual code.
- Produce concrete objections and severity (`high`/`medium`/`low`).

### Phase C: BUILDER (Refiner)
- Address each objection with either:
  - a fix, or
  - a justified rejection with evidence.
- Re-run verification impacted by refinements.

Record the outcome in the memory ledger whenever the critic phase surfaces a meaningful insight or correction.

## 3) Long-Term Memory Rules (Append-Only)

### What must be appended
Append an entry for any **important**:
- discovery (facts about architecture/behavior/constraints),
- change (design or implementation decisions),
- insight (risk/tradeoff/lessons likely to matter later).

### Importance threshold
An item is important if it affects at least one of:
- security/privacy/compliance,
- data model or API contract behavior,
- deployment/runtime configuration,
- user-visible workflow,
- future change safety (known traps, incompatibilities, debt),
- versioning/release process.

### Entry format (required)
Use this exact schema for each new entry:

```md
### [YYYY-MM-DD HH:MM UTC] <TYPE> <short title>
- Scope: <files/modules/features impacted>
- Trigger: <what prompted this>
- Observation/Change: <durable fact>
- Evidence: <file paths and key commands>
- Decision: <what to do going forward>
- Risk: <high|medium|low + rationale>
- Follow-up: <next action or "none">
```

### Memory hygiene
- Never rewrite or delete prior entries except to append a corrective entry.
- Prefer concrete file paths and command evidence.
- If an older memory is superseded, add a new entry that references it.

## 4) Project Ground Truth (Current)

- Stack: Next.js 16 App Router + React 19 + TypeScript 5 + Tailwind 4.
- Auth: `@ratio1/cstore-auth-ts` + JWT session cookie `cerviguard_session`.
- Case data:
  - image bytes stored via R1FS (`addFileBase64`),
  - case metadata stored in CStore hash `config.CASES_HKEY`.
- Analysis: synchronous `POST {baseUrl}/predict` call from `src/lib/analysis/analyzer.ts`.
- Mock mode default: enabled outside production (`USE_RATIO1_MOCK` defaults to `true` in dev).

## 5) Release/Version Memory Rule

- UI version footer reads from `package.json` version via `next.config.ts` (`NEXT_PUBLIC_APP_VERSION`), displayed in `src/components/version-footer.tsx`.
- Do not describe or manage versioning via an `APP_VERSION` manual semantic segment policy unless code is changed to support that again.
- When version changes are needed, update `package.json` version and document rationale in the task summary.

## 6) Current Memory Ledger (Append-Only)

### [2026-02-11 05:46 UTC] DISCOVERY Repository had `AGENT` but no `AGENTS.md`
- Scope: repository governance docs.
- Trigger: full project review request.
- Observation/Change: existing guidance was in `AGENT`; durable memory contract file `AGENTS.md` was missing.
- Evidence: `ls -la`, `sed -n '1,260p' AGENT`.
- Decision: establish `AGENTS.md` as long-term memory + process authority for future agents.
- Risk: medium (without durable memory, important context is repeatedly lost).
- Follow-up: keep appending important discoveries/changes here.

### [2026-02-11 05:46 UTC] DISCOVERY Versioning docs were out of sync with code
- Scope: version process, docs correctness.
- Trigger: project-wide documentation audit.
- Observation/Change: old docs claimed manual `APP_VERSION` policy; actual version source is `package.json` -> `NEXT_PUBLIC_APP_VERSION`.
- Evidence: `next.config.ts`, `src/components/version-footer.tsx`, old `README.md`, `AGENT`.
- Decision: treat `package.json` as release version source of truth unless implementation changes.
- Risk: medium (incorrect release instructions cause wrong version reporting).
- Follow-up: keep README and agent memory aligned to this behavior.

### [2026-02-11 05:46 UTC] DISCOVERY Analysis path is synchronous in case creation
- Scope: API latency, operational behavior, UX.
- Trigger: backend service review.
- Observation/Change: `POST /api/cases` uploads image, creates case, and waits for analysis before final status update.
- Evidence: `src/lib/services/caseService.ts`, `src/lib/analysis/analyzer.ts`, `src/app/api/cases/route.ts`.
- Decision: document timeout/latency implications and treat async job orchestration as a future enhancement.
- Risk: medium (long inference can delay request completion and reduce throughput).
- Follow-up: consider queue/job architecture if production load grows.

### [2026-02-11 05:46 UTC] DISCOVERY Admin reset support is split across two endpoints
- Scope: user-management API clarity.
- Trigger: API route audit.
- Observation/Change: `/api/users/reset-password` performs admin reset, while `/api/users/[userId]/password` intentionally returns `501`.
- Evidence: `src/app/api/users/reset-password/route.ts`, `src/app/api/users/[userId]/password/route.ts`.
- Decision: treat `/api/users/reset-password` as active path; preserve 501 endpoint as explicit unsupported legacy shape.
- Risk: low (confusing but not functionally broken).
- Follow-up: deprecate or remove unused endpoint shape when safe.

### [2026-02-11 05:46 UTC] DISCOVERY Production hardening is required before deployment
- Scope: security and deployment readiness.
- Trigger: configuration and auth inspection.
- Observation/Change: demo fallbacks exist for session secret and mock defaults; warnings are logged when secure env vars are absent.
- Evidence: `src/lib/config.ts`, `src/lib/constants/session.ts`, `middleware.ts`.
- Decision: deployments must set secure session/auth values and disable mocks.
- Risk: high (unsafe defaults in production can compromise auth integrity).
- Follow-up: enforce env validation in CI/CD or startup checks.

### [2026-02-11 05:47 UTC] CHANGE Established durable memory + adversarial workflow contract
- Scope: `AGENTS.md`, future agent execution process.
- Trigger: user request to convert agent instructions into long-term memory with critic/refiner loop.
- Observation/Change: introduced mandatory Builder -> Critic -> Builder cycle and append-only memory protocol with entry schema.
- Evidence: `AGENTS.md`.
- Decision: every meaningful task must now end with adversarial review plus memory append when important findings/changes occur.
- Risk: low (process overhead), mitigated by higher reliability and less context loss.
- Follow-up: none.

### [2026-02-11 05:47 UTC] CHANGE Updated README to purpose/usability-first structure
- Scope: `README.md`, onboarding and technical documentation.
- Trigger: user request to prioritize need/objective/purpose and usability/features before technical detail.
- Observation/Change: reorganized README to flow from mission and user workflow into implementation detail; aligned technical sections to actual code/env behavior.
- Evidence: `README.md`, `src/lib/config.ts`, `next.config.ts`, `src/components/version-footer.tsx`.
- Decision: keep README organized as product intent + usability first, technical/reference second.
- Risk: low.
- Follow-up: keep README synchronized whenever API/config/flows change.

### [2026-02-11 05:47 UTC] DISCOVERY `npm run lint` currently fails on baseline issues unrelated to docs
- Scope: repository quality gates.
- Trigger: post-change verification run.
- Observation/Change: lint reports 3 errors and 2 warnings in existing source files (`no-explicit-any`, `react/no-unescaped-entities`, unused route params).
- Evidence: `npm run lint` output; files: `src/lib/services/userService.ts`, `src/components/edit-user-modal.tsx`, `src/components/reset-password-modal.tsx`, `src/app/api/users/[userId]/password/route.ts`.
- Decision: treat as baseline debt; do not conflate with documentation-only edits.
- Risk: medium (CI blockers and reduced signal quality).
- Follow-up: schedule focused lint cleanup PR.

### [2026-02-11 06:03 UTC] CHANGE Added canonical BibTeX citation to project docs
- Scope: `README.md` citation/distribution metadata.
- Trigger: user request to add BibTeX citation with team authors.
- Observation/Change: added a terminal `Citation` section with a `@misc` BibTeX entry and author list in requested order.
- Evidence: `README.md`.
- Decision: use README as human-visible citation source of truth unless a dedicated `CITATION.bib`/`CITATION.cff` is introduced later.
- Risk: low.
- Follow-up: if publication metadata changes, update citation year/key/title consistently.

### [2026-02-11 06:10 UTC] CHANGE Login screen now surfaces purpose and objectives before authentication
- Scope: `src/app/(auth)/layout.tsx`, landing/login UX.
- Trigger: user request to make application mission/objectives clearly visible from first screen.
- Observation/Change: converted auth layout to two-panel experience with a dedicated purpose/objective/outcome information panel and refined sign-in copy.
- Evidence: `src/app/(auth)/layout.tsx`, `npx eslint 'src/app/(auth)/layout.tsx'`.
- Decision: preserve this mission-first framing on login so first-time visitors immediately understand CerviGuard intent.
- Risk: low (UI-only change, no auth logic changes).
- Follow-up: if branding language changes, update purpose/objective text in auth layout and README together.

### [2026-02-11 06:16 UTC] CHANGE SmartClover logo integrated in landing and application header
- Scope: `public/branding/smartclover-logo.jpg`, `src/app/(auth)/layout.tsx`, `src/app/(platform)/layout.tsx`.
- Trigger: user request to fetch logo online and display it on landing plus page footer/header.
- Observation/Change: downloaded official logo from `https://smartclover.ro/smartclover_logo.jpg` and added branded logo blocks to login landing and authenticated header.
- Evidence: `public/branding/smartclover-logo.jpg`, `src/app/(auth)/layout.tsx`, `src/app/(platform)/layout.tsx`, `npx eslint 'src/app/(auth)/layout.tsx' 'src/app/(platform)/layout.tsx'`.
- Decision: use the local bundled logo asset for stable rendering and avoid runtime external image dependencies.
- Risk: low (presentation-only change, no behavioral logic impact).
- Follow-up: replace with transparent/SVG source if brand team provides higher-fidelity identity assets.
