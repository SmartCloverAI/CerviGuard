## SmartClover CerviGuard Pilot

SmartClover CerviGuard is a pilot web console that allows authorized clinicians and admins to upload cervical images for automated analysis, powered by Ratio1.ai infrastructure. The app is built on the Next.js App Router stack and integrates with Ratio1’s native APIs:

- **R1FS** for encrypted, decentralized image storage.
- **CStore** for distributed user, case, and result metadata.

> ℹ️ For local development the app ships with a file-backed mock of the Ratio1 APIs. Provide the real endpoints via environment variables to connect to the live network.

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
| `R1FS_API_URL` | Base URL override for Ratio1 File System API | derived from `R1EN_BASE_URL` |
| `CSTORE_API_URL` | Base URL override for Ratio1 CStore API | derived from `R1EN_BASE_URL` |
| `R1EN_BASE_URL` | Ratio1 edge node gateway (e.g. `https://edge.local`) | — |
| `R1EN_APP_ID` | Edge application identifier | — |
| `R1EN_APP_TOKEN` | Edge auth token (bearer) | — |
| `SESSION_SECRET` | Secret for signing session tokens | generated dev secret |
| `SESSION_MAX_AGE` | Session lifespan (seconds) | `28800` (8 hours) |
| `DEFAULT_ADMIN_USERNAME` | Seed admin username (mock mode only) | `demo` |
| `DEFAULT_ADMIN_PASSWORD` | Seed admin password (mock mode only) | `demo` |
| `LOCAL_STATE_DIR` | Filesystem path for mock storage | `.ratio1-local-state` |

When `R1FS_API_URL` and `CSTORE_API_URL` are both provided the mock layer is bypassed and real Ratio1 endpoints are used. The remote client assumes REST endpoints similar to the Ratio1 RedMesh app (`/users/create`, `/cases/create`, etc.) — adjust inside `src/lib/ratio1` if your deployment varies.

---

## Key features

- **Authentication & sessions** – username/password login with JWT-backed cookies, admin-only routes, and logout handling.
- **Admin dashboard** – provision new users, enforce role-based access, and view full case history.
- **Case uploads** – clinicians can upload cervical imagery, optionally add notes, and trigger simultaneous TZ + lesion analyses.
- **Automated insights** – case detail views aggregate model outputs (TZ class, lesion risk, narrative summary, risk score).
- **R1FS-backed images** – images are written to R1FS by CID; mock mode stores them locally under `.ratio1-local-state/r1fs/`.
- **CStore metadata** – cases, users, and results are synced through the CStore abstraction; mock mode persists to `cstore.json`.

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
    ratio1/           # R1FS & CStore clients (mock + remote)
    services/         # Use-cases for users and cases
    storage/          # Local filesystem-backed mock state
```

---

## Development notes

- Jest or E2E tests are not yet wired for this pilot. When integrating into CI, consider adding API contract tests around `src/app/api`.
- The mock Ratio1 clients hash uploaded bytes to create CIDs. Deleting `.ratio1-local-state` will clear local state.
- Switch between mocks and the edge node by flipping `USE_RATIO1_MOCK`; production containers should set it to `false` and provide the `R1EN_*` credentials.
- Global styling lives in `src/app/globals.css` (Tailwind v4); adjust class-based helpers there when tweaking the UI.

---

## Next steps

1. Wire `RemoteCStoreClient` and `RemoteR1FSClient` to the production Ratio1 endpoints with proper authentication headers.
2. Replace `runCervicalAnalysis` with real model invocation (or orchestrate asynchronous job handling / webhooks).
3. Add audit logging (e.g., push case hashes on-chain) and extend admin tooling (password reset, user suspension).
4. Harden security: rate limiting on auth routes, CSRF protection for uploads, and optional 2FA for admins.
