# SmartClover CerviGuard Pilot

CerviGuard is a system for cervical image intake, automated AI analysis, and role-based clinical review. It is designed for privacy-oriented workflows where imaging artifacts are end-to-end encrypted and stored by content ID while the encrypted case metadata is synchronized through distributed services on permissioned edge-nodes with no central authority, no single point of failure, no central cenzorship, true data governance/ownership and full auditability. The web console functions in conjunction with on-edge inference capabilities to provide transformation zone and lesion classification for cervical screening support.

## Need

Cervical screening teams need a workflow that is:
- fast enough for routine case intake,
- secure enough for sensitive medical imagery,
- structured enough for clinician/admin collaboration and traceability.

## Objective

Provide a production-approachable pilot that lets authorized users:
- authenticate with role-based access,
- upload de-identified cervical images,
- receive automated transformation-zone and lesion classifications,
- review case history and outputs with auditable metadata.

## Purpose

Bridge clinical workflow and decentralized infrastructure by combining:
- R1FS for content-addressed image storage,
- CStore for distributed case/user metadata,
- an on-edge inference service for cervical analysis.

## Usability and Features

This prototype (TRL 6) has been already used in a small-scale oncological clinical context with de-identified images. It is not currently hardened for production deployment, but it demonstrates the core workflow and technical architecture needed to support a secure, efficient, and user-friendly cervical screening case management system.

### Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default mock admin credentials:
- Username: `admin`
- Password: `password`

In local mock mode, state is stored under `.ratio1-local-state/`.

### User Roles

- `user` (clinician): create and review own cases.
- `admin`: full case visibility + user management.

### Core Workflow

1. Sign in.
2. Upload a cervical image (`jpeg/png/webp`, max 20 MB) and optional notes.
3. Case is stored with status `processing`, then analysis is executed.
4. Case transitions to `completed` or `error` with detailed result metadata.
5. Review results in case detail pages and dashboard summaries.

### Feature Set

- Secure login/logout with JWT-backed session cookies.
- Role-gated navigation and middleware-protected routes.
- Case history list (all cases for admin, own cases for clinicians).
- Case detail view with image retrieval guardrails (`caseId` + ownership checks).
- AI result display for:
  - transformation-zone classification,
  - lesion classification,
  - per-class confidence distributions,
  - image metadata (dimensions/channels),
  - processor timestamp/version and error details.
- Admin console:
  - create users,
  - update role and active/inactive status,
  - reset passwords through admin reset endpoint.
- Toast notifications for UX feedback in critical actions.

### Operational Notes for Users

- Upload only de-identified clinical images.
- AI outputs are decision-support signals, not standalone diagnosis.
- If services are unavailable, UI surfaces explicit warnings on affected pages.

## Technical

### Stack

- Next.js 16 App Router
- React 19
- TypeScript 5 (`strict`)
- Tailwind CSS 4
- `@ratio1/edge-sdk-ts` (R1FS/CStore access)
- `@ratio1/cstore-auth-ts` (auth/user store)
- `jose` (JWT), `zod` (validation)

### High-Level Architecture

```text
Browser UI
  -> Next.js App Router pages + API routes
    -> userService / caseService
      -> CStoreAuth (users/auth)
      -> Edge SDK (R1FS + CStore)
      -> On-edge analyzer POST /predict
```

### Data and Processing Flow

1. `/api/cases` receives multipart upload.
2. Image bytes are encoded to base64 and sent to R1FS.
3. Case record is created in CStore with `status: processing`.
4. Analyzer calls `POST {baseUrl}/predict` with base64 payload.
5. Response is validated/mapped to internal `CaseResult`.
6. Case record is updated to `completed` or `error`.

Important behavior:
- Current analysis path is synchronous inside case creation.
- Long inference times directly affect request latency.

### Auth and Access Control

- Session cookie: `cerviguard_session`
- JWT: HS256, TTL from `AUTH_SESSION_TTL_SECONDS` (default 86400 in config)
- Middleware protects:
  - `/dashboard/**`
  - `/cases/**`
  - `/admin/**`
  - `/login` redirect behavior for already-authenticated users

### Configuration (Most Relevant)

| Variable | Purpose | Default/Behavior |
| --- | --- | --- |
| `USE_RATIO1_MOCK` | Enable local mock behavior | `true` outside production unless overridden |
| `LOCAL_STATE_DIR` | Local mock storage directory | `.ratio1-local-state` |
| `DEFAULT_ADMIN_USERNAME` | Seed admin username (mock) | `admin` |
| `DEFAULT_ADMIN_PASSWORD` | Seed admin password (mock/bootstrap fallback) | `password` |
| `SESSION_SECRET` / `NEXT_PUBLIC_SESSION_SECRET` / `EE_SESSION_SECRET` / `EDGE_SESSION_SECRET` | JWT signing secret source chain | falls back to demo value if unset (not safe for prod) |
| `EE_R1FS_API_URL` / `R1FS_API_URL` | R1FS endpoint override | optional |
| `EE_CHAINSTORE_API_URL` / `CHAINSTORE_API_URL` | CStore endpoint override | optional |
| `EE_CHAINSTORE_PEERS` / `CHAINSTORE_PEERS` | Peer list JSON array | `[]` |
| `R1EN_HOST_IP` | Analyzer host | `localhost` |
| `API_PORT` | Analyzer port | `5082` |
| `CERVIGUARD_API_TIMEOUT` | Analyzer timeout (ms) | `250000` |
| `EE_CSTORE_AUTH_HKEY` / `EE_CSTORE_AUTH_SECRET` | Auth store keying/secrets | required for secure non-mock auth |

Additional display-only envs used by UI badges:
- Host ID: `EE_HOST_ID`, `NEXT_PUBLIC_EE_HOST_ID`, `RATIO1_HOST_ID`, `NEXT_PUBLIC_RATIO1_HOST_ID`
- Peer count display also reads: `R1EN_CHAINSTORE_PEERS` and corresponding `NEXT_PUBLIC_*` variants.

### Versioning

- UI version footer reads `package.json` version via `next.config.ts` -> `NEXT_PUBLIC_APP_VERSION`.
- If release version changes, update `package.json`.

### API Surface (Current)

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/cases`
- `POST /api/cases`
- `GET /api/cases/[caseId]`
- `GET /api/files/[cid]?caseId=...`
- `GET /api/users` (admin)
- `POST /api/users` (admin create)
- `PUT /api/users` (self/admin change password with current password)
- `PATCH /api/users` (admin update role/status)
- `POST /api/users/reset-password` (admin reset without current password)
- `PATCH /api/users/[userId]/password` -> returns `501` (unsupported legacy shape)

### Project Layout

```text
src/
  app/
    (auth)/                 login experience
    (platform)/             authenticated UI (dashboard/cases/admin/profile)
    api/                    route handlers
  components/               reusable UI components/modals
  contexts/                 client-side providers (toast)
  lib/
    analysis/               analyzer API mapping and validation
    auth/                   session + auth client setup
    ratio1/                 SDK wrappers for R1FS/CStore
    services/               user/case use-cases
```

### Security and Deployment Baseline

Before any production deployment:
1. Set secure session/auth secrets (no demo fallbacks).
2. Set `USE_RATIO1_MOCK=false`.
3. Configure real R1FS/CStore endpoints.
4. Validate analyzer connectivity and timeout profile for expected workload.
5. Add deployment-level safeguards (rate limiting, monitoring, audit logging).

### Known Gaps / Follow-Up Targets

- No automated test suite is currently wired (unit/integration/e2e).
- `deleteCase` is stubbed in CStore client pending SDK support for delete semantics.
- Case creation currently blocks on analysis completion; queue-based async orchestration is a natural next hardening step.

## Citations

```bibtex
@misc{cerviguard_pilot,
  title        = {SmartClover CerviGuard Pilot},
  author       = {Andreea D and Cristian Bleotiu and Vitalii Toderian and Florian Nicula},
  year         = {2024-2026},
  howpublished = {\url{https://github.com/SmartCloverAI/CerviGuard}},
  website      = {\url{https://cerviguard.link}},
  note         = {Pilot web console for cervical image analysis and case management}
}
```
```bibtex
@article {Nyanchokae053954,
	author = {Nyanchoka, Linda and Damian, Andreea and Nyg{\r a}rd, Mari},
	title = {Understanding facilitators and barriers to follow-up after abnormal cervical cancer screening examination among women living in remote areas of Romania: a qualitative study protocol},
	volume = {12},
	number = {2},
	elocation-id = {e053954},
	year = {2022},
	doi = {10.1136/bmjopen-2021-053954},
	publisher = {British Medical Journal Publishing Group},
	issn = {2044-6055},
	URL = {https://bmjopen.bmj.com/content/12/2/e053954},
	eprint = {https://bmjopen.bmj.com/content/12/2/e053954.full.pdf},
	journal = {BMJ Open}
}
```

```bibtex
@article{ANDREASSEN201748,
title = {Controversies about cervical cancer screening: A qualitative study of Roma women's (non)participation in cervical cancer screening in Romania},
journal = {Social Science & Medicine},
volume = {183},
pages = {48-55},
year = {2017},
issn = {0277-9536},
doi = {https://doi.org/10.1016/j.socscimed.2017.04.040},
url = {https://www.sciencedirect.com/science/article/pii/S0277953617302708},
author = {Trude Andreassen and Andreea Ituand Elisabete Weiderpass and Florian Nicula and Ofelia Suteu  and Minodora Bumbu and Aida Tincu and Giske Ursin and Kåre Moen},
keywords = {Cervical cancer, Cervical cancer-screening, Roma, Romania, Participation, Controversies, Interessement, User involvement}
}
```