# CerviGuard - Note tehnice (condensat)

## Stack si arhitectura
- Next.js App Router (route handlers in `src/app/api/*`), React server/client components, Tailwind.
- Stocare continut: R1FS (fisier -> CID) prin `@ratio1/edge-sdk-ts` (`src/lib/ratio1/*`).
- Metadate si rezultate: CStore (HSET/HGET/HGETALL) pentru cazuri si utilizatori.
- Autentificare: `@ratio1/cstore-auth-ts` + sesiune JWT HS256 in cookie `cerviguard_session`.

## Flux principal (creare caz)
- `POST /api/cases` valideaza inputul, incarca imaginea in R1FS (base64), creeaza un `CaseRecord` in CStore.
- Se ruleaza analiza, apoi cazul este actualizat cu rezultatul; la eroare se marcheaza `error`.
- `GET /api/files/[cid]` proxyeaza imaginea din R1FS, cu verificare de acces.

## Inferenta on-edge (local)
- Implementata in `src/lib/analysis/analyzer.ts` prin apel API local.
- Endpoint: `POST {baseUrl}/predict`, body JSON cu `image_data` (base64) + metadata.
- `baseUrl` = `http://{R1EN_HOST_IP}:{API_PORT}`, implicit `http://localhost:5082`.
- Timeout controlat de `CERVIGUARD_API_TIMEOUT` (implicit 250s).
- Raspunsul este mapat in `CaseResult` (snake_case -> camelCase) si validat (TZ, leziuni, scor 0-100).

## Moduri de rulare
- `USE_RATIO1_MOCK=true` foloseste mock local (`.ratio1-local-state/`), inclusiv auth store.
- In productie, configurarea edge se face prin `R1FS_API_URL`, `CSTORE_API_URL`, `R1EN_*`.
