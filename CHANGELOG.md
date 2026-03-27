# CerviGuard Change Log

Durable discoveries, changes, and operational notes for this repository live here.
Entries before `2026-03-27 08:56 UTC` were migrated from `AGENTS.md` when that file was converted to instructions-only.

### [2026-02-11 05:46 UTC] DISCOVERY Repository had `AGENT` but no `AGENTS.md`
- Scope: repository governance docs.
- Trigger: full project review request.
- Observation/Change: existing guidance was in `AGENT`; durable memory contract file `AGENTS.md` was missing.
- Evidence: `ls -la`, `sed -n '1,260p' AGENT`.
- Decision: establish `AGENTS.md` as long-term process authority for future agents.
- Risk: medium (without durable operating guidance, important context is repeatedly lost).
- Follow-up: keep appending important discoveries/changes in the repository change log.

### [2026-02-11 05:46 UTC] DISCOVERY Versioning docs were out of sync with code
- Scope: version process, docs correctness.
- Trigger: project-wide documentation audit.
- Observation/Change: old docs claimed manual `APP_VERSION` policy; actual version source is `package.json` -> `NEXT_PUBLIC_APP_VERSION`.
- Evidence: `next.config.ts`, `src/components/version-footer.tsx`, old `README.md`, `AGENT`.
- Decision: treat `package.json` as release version source of truth unless implementation changes.
- Risk: medium (incorrect release instructions cause wrong version reporting).
- Follow-up: keep README and agent instructions aligned to this behavior.

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
- Decision: treat `/api/users/reset-password` as active path; preserve the `501` endpoint as an explicit unsupported legacy shape.
- Risk: low (confusing but not functionally broken).
- Follow-up: deprecate or remove the unused endpoint shape when safe.

### [2026-02-11 05:46 UTC] DISCOVERY Production hardening is required before deployment
- Scope: security and deployment readiness.
- Trigger: configuration and auth inspection.
- Observation/Change: demo fallbacks exist for session secret and mock defaults; warnings are logged when secure env vars are absent.
- Evidence: `src/lib/config.ts`, `src/lib/constants/session.ts`, `middleware.ts`.
- Decision: deployments must set secure session/auth values and disable mocks.
- Risk: high (unsafe defaults in production can compromise auth integrity).
- Follow-up: enforce env validation in CI/CD or startup checks.

### [2026-02-11 05:47 UTC] CHANGE Established durable memory and adversarial workflow contract
- Scope: repository workflow documentation.
- Trigger: user request to convert agent instructions into long-term operating guidance with a critic/refiner loop.
- Observation/Change: introduced the mandatory Builder -> Critic -> Builder cycle and append-only durable logging process.
- Evidence: `AGENTS.md`.
- Decision: every meaningful task should end with adversarial review plus an appended durable entry when important findings or changes occur.
- Risk: low (process overhead), mitigated by higher reliability and less context loss.
- Follow-up: none.

### [2026-02-11 05:47 UTC] DISCOVERY `npm run lint` currently fails on baseline issues unrelated to docs
- Scope: repository quality gates.
- Trigger: post-change verification run.
- Observation/Change: lint reports 3 errors and 2 warnings in existing source files (`no-explicit-any`, `react/no-unescaped-entities`, unused route params).
- Evidence: `npm run lint` output; files: `src/lib/services/userService.ts`, `src/components/edit-user-modal.tsx`, `src/components/reset-password-modal.tsx`, `src/app/api/users/[userId]/password/route.ts`.
- Decision: treat as baseline debt; do not conflate with documentation-only edits.
- Risk: medium (CI blockers and reduced signal quality).
- Follow-up: schedule a focused lint cleanup PR.

### [2026-02-17 10:54 UTC] CHANGE Pruned minor ledger entries by owner request
- Scope: historical documentation maintenance.
- Trigger: explicit repository-owner request to prune minor modifications from the durable log.
- Observation/Change: removed low-impact UI/docs/citation branding entries and retained high-signal architecture, security, process, and quality-gate records.
- Evidence: `AGENTS.md`; `git diff -- AGENTS.md`.
- Decision: keep the durable log focused on operationally relevant facts; continue logging minor changes only when they materially affect future change safety.
- Risk: low (reduced historical granularity), mitigated by preserving high-signal records and code history in git.
- Follow-up: none.

### [2026-03-27 08:49 UTC] CHANGE Canonicalized Vitalii git identities to Andreea Damian
- Scope: git history for `main`, local `origin/main`, repository change-log policy.
- Trigger: repository-owner request to change all commits by `toderian`, `vitalii-t12`, or `Vitalii` to `Andreea Damian`.
- Observation/Change: rewrote reachable local history so those aliases and their recorded emails/GitHub noreply variants now resolve to `Andreea Damian <andreea@smartclover.ro>`; critic review found that `git filter-branch` left `refs/original/*`, so those refs were deleted and reflogs/objects pruned to prevent the old identities from remaining reachable via `--all`.
- Evidence: `git bundle create /tmp/cerviguard-git-backups/CerviGuard-pre-author-rewrite-20260327.bundle --all`; `git filter-branch -f --env-filter ... -- main refs/remotes/origin/main`; `git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin`; `git reflog expire --expire=now --all`; `git gc --prune=now`; `git shortlog -sne --all`.
- Decision: treat `Andreea Damian <andreea@smartclover.ro>` as the canonical replacement identity for those historical Vitalii aliases; when publishing this rewrite, coordinate an explicit force-push because commit SHAs changed.
- Risk: medium (history rewrites change commit SHAs and require coordinated remote updates), mitigated by the backup bundle stored at `/tmp/cerviguard-git-backups/CerviGuard-pre-author-rewrite-20260327.bundle`.
- Follow-up: none.

### [2026-03-27 08:56 UTC] CHANGE Split operating instructions from the durable change log
- Scope: `AGENTS.md`, `CHANGELOG.md`, repository documentation workflow.
- Trigger: repository-owner request that `AGENTS.md` contain no history and that the change log live in a separate `CHANGELOG.md`.
- Observation/Change: rewrote `AGENTS.md` to contain operating instructions only, redirected all future durable entries to `CHANGELOG.md`, and migrated the previously recorded high-signal entries into the new changelog file.
- Evidence: `AGENTS.md`, `CHANGELOG.md`, `git show HEAD~1:AGENTS.md`, `sed -n '1,220p' AGENTS.md`.
- Decision: keep `AGENTS.md` instruction-only and append future durable project history exclusively to `CHANGELOG.md`.
- Risk: low (documentation-only restructuring), mitigated by migrating prior entries instead of dropping them.
- Follow-up: none.

### [2026-03-27 09:00 UTC] CHANGE Documented public model locations and bumped release version
- Scope: `README.md`, `package.json`, `package-lock.json`, `CHANGELOG.md`.
- Trigger: repository-owner request to document the public Hugging Face model org and separate training repo, then increment the app version.
- Observation/Change: README now states that public CerviGuard models are published under the Hugging Face `smartclover` organization and that model creation/training scripts live in `SmartCloverAI/CerviGuardModels`; release metadata was bumped to `0.4.9`, and the stale lockfile header was aligned from `0.4.6`.
- Evidence: `README.md`, `package.json`, `package-lock.json`, `CHANGELOG.md`, `sed -n '1,260p' README.md`, `sed -n '1,40p' package-lock.json`.
- Decision: keep distribution/model-training references in README and treat `package.json` plus the lockfile header as the version metadata that must move together for releases.
- Risk: low (documentation and version metadata only), mitigated by keeping the change scoped to references and release identifiers.
- Follow-up: none.
