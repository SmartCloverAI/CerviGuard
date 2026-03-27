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
- Never rewrite or delete prior entries except to append a corrective entry, or when repository owners explicitly request pruning of minor entries (must record the pruning decision in the ledger).
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

## 6) Current Memory Ledger (Curated High-Signal)
