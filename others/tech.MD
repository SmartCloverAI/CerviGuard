# CerviGuard - Documentație Tehnică

## Stack Tehnologic

| Categorie | Tehnologie |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Limbaj | TypeScript 5 (strict mode) |
| Autentificare | JWT (jose), bcryptjs |
| Validare | Zod |
| SDK | @ratio1/edge-sdk-ts, @ratio1/cstore-auth-ts |

## Arhitectura Aplicației

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Layout autentificare
│   ├── (platform)/        # Layout platformă autentificată
│   └── api/               # Endpoint-uri REST
├── components/            # Componente React reutilizabile
├── lib/                   # Logică de bază
│   ├── analysis/          # Client API inferență
│   ├── auth/              # Gestiune sesiuni JWT
│   ├── ratio1/            # SDK wrappers
│   └── services/          # Servicii CRUD
├── contexts/              # React Context providers
└── middleware.ts          # Protecție rute
```

## Inferență AI - Apeluri API Locale (On-Edge)

Analiza imaginilor se realizează prin apeluri API locale către un server de inferență edge.

### Configurare Endpoint

```typescript
// lib/config.ts
const API_HOST = process.env.R1EN_HOST_IP || 'localhost'
const API_PORT = process.env.API_PORT || '5082'
const API_URL = `http://${API_HOST}:${API_PORT}`
```

### Fluxul de Analiză

```
Încărcare Imagine → Upload R1FS (base64) → POST /predict
                                              ↓
                                    Server Inferență Local
                                              ↓
                                    Răspuns JSON cu rezultate
                                              ↓
                                    Stocare în CStore
```

### Request API Inferență

```typescript
// lib/analysis/analyzer.ts
POST ${API_URL}/predict
Content-Type: application/json
Timeout: 250 secunde

{
  "image_data": "<base64_encoded_image>",
  "metadata": { "source": "cerviguard_web_app" }
}
```

### Răspuns API Inferență

```json
{
  "result": {
    "status": "completed",
    "request_id": "uuid",
    "analysis": {
      "tz_type": "Type 2",
      "lesion_assessment": "low",
      "lesion_summary": "...",
      "risk_score": 25,
      "image_quality": "high",
      "image_quality_sufficient": true,
      "image_info": {
        "width": 1920,
        "height": 1080,
        "channels": 3,
        "size_mb": "5.95"
      }
    }
  }
}
```

## Autentificare și Sesiuni

### Mecanism JWT

- Algoritm: HS256
- TTL: 28800 secunde (8 ore)
- Cookie: `cerviguard_session` (httpOnly, SameSite: Lax)

### Payload Token

```typescript
{
  sub: string,              // username
  role: "admin" | "user",
  exp: number,              // expirare
  iat: number               // emitere
}
```

## Stocare Date

### R1FS (Imagini)
- Stocare content-addressed cu criptare
- Fișiere identificate prin CID (Content ID)
- Mod mock: `.ratio1-local-state/r1fs/`

### CStore (Metadate)
- Registru distribuit pentru cazuri și utilizatori
- Hash keys configurabile:
  - `cerviguard:cases` - cazuri
  - `cerviguard:users` - utilizatori
  - `cerviguard:auth` - autentificare

## Variabile de Mediu

| Variabilă | Scop | Default |
|-----------|------|---------|
| `USE_RATIO1_MOCK` | Activare backend mock | `true` (dev) |
| `R1EN_HOST_IP` | Host server inferență | `localhost` |
| `API_PORT` | Port API inferență | `5082` |
| `CERVIGUARD_API_TIMEOUT` | Timeout inferență (ms) | `250000` |
| `SESSION_SECRET` | Secret semnare JWT | - |
| `EE_CSTORE_AUTH_HKEY` | Hash key autentificare | `cerviguard:auth` |

## Endpoint-uri API

| Metodă | Rută | Scop |
|--------|------|------|
| POST | `/api/auth/login` | Autentificare |
| GET | `/api/auth/me` | Sesiune curentă |
| POST | `/api/cases` | Creare caz + analiză |
| GET | `/api/cases` | Lista cazuri |
| GET | `/api/cases/[id]` | Detalii caz |
| GET | `/api/files/[cid]` | Descărcare imagine |
| POST/GET/PUT/PATCH | `/api/users` | CRUD utilizatori |

## Modele de Date

### User
```typescript
{
  username: string
  role: "admin" | "user"
  createdAt: string
  metadata?: { isActive?: boolean }
}
```

### Case
```typescript
{
  id: string
  username: string
  imageCid: string
  notes?: string
  status: "processing" | "completed" | "error"
  result?: CaseResult
}
```

## Dezvoltare Locală

```bash
# Instalare dependențe
npm install

# Pornire server dezvoltare (cu backend mock)
npm run dev

# Credențiale implicite
# Username: admin / Parolă: password
```

## Producție

1. Setare `USE_RATIO1_MOCK=false`
2. Configurare variabile `R1EN_*` pentru endpoint-uri reale
3. Configurare secret-uri securizate (`SESSION_SECRET`, `EE_CSTORE_AUTH_SECRET`)
4. Activare HTTPS pentru cookie-uri secure
5. Configurare `R1EN_HOST_IP` și `API_PORT` pentru serverul de inferență local