## SmartClover CerviGuard Pilot

SmartClover CerviGuard is a pilot web console that enables authorized clinicians and admins to upload cervical images for automated analysis, powered by decentralized, secure and privacy-oriented technology. The app is built on the Next.js App Router stack and connects to R1FS (content-addressed storage) and CStore (distributed metadata) through the `@ratio1/edge-sdk-ts` client.

- **R1FS storage** – client-side encrypted uploads are persisted by content identifier.
- **CStore metadata** – users, cases, and analytic results are synchronized through a distributed registry.

---

## Getting started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with the default mock admin seed:

- **Username:** `demo`
- **Password:** `demo`

You can change these defaults via environment variables (see below). All pilot data written while using the mock backend lives inside `.ratio1-local-state/`.

---

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `USE_RATIO1_MOCK` | Force local mocks (`true`/`false`) | `true` in dev, `false` in prod |
| `R1FS_API_URL` | Base URL override for the R1FS service | derived from `R1EN_BASE_URL` |
| `CSTORE_API_URL` | Base URL override for the CStore service | derived from `R1EN_BASE_URL` |
| `R1EN_BASE_URL` | Edge gateway base URL (e.g. `https://edge.local`) | — |
| `R1EN_APP_ID` | Edge application identifier | — |
| `R1EN_APP_TOKEN` | Edge auth token (bearer) | — |
| `R1EN_CHAINSTORE_PEERS` | Optional JSON array of peer URLs | `[]` |
| `EE_CSTORE_AUTH_HKEY` | Hash key used by `@ratio1/cstore-auth-ts` | — |
| `EE_CSTORE_AUTH_SECRET` | Pepper used by the auth layer | — |
| `EE_CSTORE_AUTH_BOOTSTRAP_ADMIN_PW` | One-time bootstrap admin password | — |
| `SESSION_SECRET` / `EE_SESSION_SECRET` / `EDGE_SESSION_SECRET` | Secret for signing session tokens | `demo-session-secret-change-me` *(fallback – TODO replace in prod)* |
| `SESSION_MAX_AGE` | Session lifespan (seconds) | `28800` (8 hours) |
| `DEFAULT_ADMIN_USERNAME` | Seed admin username (mock mode only) | `demo` |
| `DEFAULT_ADMIN_PASSWORD` | Seed admin password (mock mode only) | `demo` |
| `CSTORE_USERS_HKEY` | Hash key used for user records | `cerviguard:users` |
| `CSTORE_USER_INDEX_HKEY` | Hash key used for username lookups | `cerviguard:usernames` |
| `CSTORE_CASES_HKEY` | Hash key used for case records | `cerviguard:cases` |
| `LOCAL_STATE_DIR` | Filesystem path for mock storage | `.ratio1-local-state` |

> ⚠️ **TODO:** Replace the bundled `demo-session-secret-change-me` fallback with a strong `SESSION_SECRET` (or equivalent) before deploying to production.

When `R1FS_API_URL` and `CSTORE_API_URL` are both provided the mock layer is bypassed and the remote clients operate against the configured edge endpoints. The remote client contracts rely on `@ratio1/edge-sdk-ts` to speak to R1FS and CStore — adjust inside `src/lib/ratio1` if your deployment varies.

---

## Key features

- **Authentication & sessions** – username/password login with JWT-backed cookies, admin-only routes, and logout handling.
- **Admin dashboard** – provision new users, enforce role-based access, and view full case history.
- **Case uploads** – clinicians can upload cervical imagery, optionally add notes, and trigger simultaneous TZ + lesion analyses.
- **Automated insights** – case detail views aggregate model outputs (TZ class, lesion risk, narrative summary, risk score).
- **R1FS-backed storage** – images are written by CID; mock mode stores them locally under `.ratio1-local-state/r1fs/`.
- **CStore metadata sync** – cases, users, and results are persisted via the metadata abstraction; mock mode writes to `cstore.json`.

---

## Project layout

```
src/
  app/                # Next.js App Router pages & route handlers
    (auth)/           # Login experience
    (platform)/       # Authenticated console (dashboard, cases, admin)
    api/              # REST endpoints for auth, users, cases, file proxy
  components/         # Reusable client components (nav, logout button, etc.)
  lib/                # Core domain logic
    analysis/         # AI inference shim (mocked for the pilot)
    auth/             # Session token helpers
    ratio1/           # R1FS & CStore clients powered by @ratio1/edge-sdk-ts
    services/         # Use-cases for users and cases
    storage/          # Local filesystem-backed mock state
```

---

## Development notes

- Jest or E2E tests are not yet wired for this pilot. When integrating into CI, consider adding API contract tests around `src/app/api`.
- The mock clients hash uploaded bytes to create CIDs. Deleting `.ratio1-local-state` will clear local state.
- Switch between mocks and the edge gateway by flipping `USE_RATIO1_MOCK`; production containers should set it to `false` and provide the `R1EN_*` credentials.
- When using the live edge network, provide the `EE_CSTORE_AUTH_*` variables so `@ratio1/cstore-auth-ts` can bootstrap authentication.
- Admin-triggered password resets require the mock auth mode; in live mode, users must supply their current password via the auth API.
- Global styling lives in `src/app/globals.css` (Tailwind v4); adjust class-based helpers there when tweaking the UI.

---

## Next steps

1. Wire `RemoteCStoreClient` and `RemoteR1FSClient` to production edge endpoints with the official edge SDK.
2. Replace `runCervicalAnalysis` with real model invocation (or orchestrate asynchronous job handling / webhooks).
3. Add audit logging (e.g., push case hashes to an immutable ledger) and extend admin tooling (password reset, user suspension).
4. Harden security: rate limiting on auth routes, CSRF protection for uploads, and optional 2FA for admins.
