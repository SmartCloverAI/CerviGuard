import { randomBytes } from "crypto";
import { join, isAbsolute } from "path";
import { DEMO_SESSION_SECRET, readSessionSecretFromEnv } from "./constants/session";

const env = process.env;

function normalizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `http://${url}`;
  }
  return url;
}

function parseChainStorePeers(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined) return defaultValue;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

const useMockBackend = parseBoolean(env.USE_RATIO1_MOCK, env.NODE_ENV !== "production");
const useLocal = parseBoolean(env.USE_LOCAL, true);
const localStateDir = env.LOCAL_STATE_DIR ?? ".ratio1-local-state";
const dataDir = env.DATA_DIR ?? "/data";

function resolveDataPath(...paths: string[]): string {
  const base = isAbsolute(dataDir) ? dataDir : join(process.cwd(), dataDir);
  return join(base, ...paths);
}
const defaultAdminUsername = env.DEFAULT_ADMIN_USERNAME ?? "admin";
const defaultAdminPassword = env.DEFAULT_ADMIN_PASSWORD ?? "password";

// Main configuration object matching ratio1-drive pattern
export const config = {
  // App-specific settings
  CASES_HKEY: env.CSTORE_CASES_HKEY ?? "cerviguard:cases",
  DEBUG: env.NODE_ENV === "development" || env.DEBUG === "true",
  useMocks: useMockBackend,
  useLocal,
  localStateDir,
  dataDir,
  mockAdmin: {
    username: defaultAdminUsername,
    password: defaultAdminPassword,
  },
  mockAuth: {
    hkey: env.EE_CSTORE_AUTH_HKEY ?? env.CSTORE_USERS_HKEY ?? "cerviguard:users",
    secret: env.MOCK_AUTH_SECRET ?? env.EE_CSTORE_AUTH_SECRET ?? "cerviguard-mock-secret",
  },

  // Edge network settings
  cstoreApiUrl: normalizeUrl(env.EE_CHAINSTORE_API_URL ?? env.CHAINSTORE_API_URL),
  r1fsApiUrl: normalizeUrl(env.EE_R1FS_API_URL ?? env.R1FS_API_URL),
  chainstorePeers: parseChainStorePeers(env.EE_CHAINSTORE_PEERS ?? env.CHAINSTORE_PEERS),

  // Authentication configuration
  auth: {
    sessionCookieName: env.AUTH_SESSION_COOKIE ?? "r1-session",
    sessionTtlSeconds: Number(env.AUTH_SESSION_TTL_SECONDS ?? 86400), // 24 hours
    cstore: {
      hkey: env.EE_CSTORE_AUTH_HKEY ?? undefined,
      secret: env.EE_CSTORE_AUTH_SECRET ?? undefined,
      bootstrapAdminPassword:
        env.EE_CSTORE_AUTH_BOOTSTRAP_ADMIN_PW ??
        env.DEFAULT_ADMIN_PASSWORD ??
        null,
    },
  },

  // CerviGuard Analysis API configuration
  cerviguardApi: {
    baseUrl: `http://${env.R1EN_HOST_IP ?? "localhost"}:${env.API_PORT ?? "5082"}`,
    timeout: Number(env.CERVIGUARD_API_TIMEOUT ?? 250000), // 250 seconds default
    debug: env.CERVIGUARD_API_DEBUG === "true",
  },
};

// Session secret (kept for compatibility)
export const SESSION_SECRET = (() => {
  const secret = readSessionSecretFromEnv(env);
  if (secret) {
    return secret;
  }
  console.warn(
    "[config] SESSION_SECRET* env vars are missing; using demo fallback. TODO: replace with a secure secret before deploying.",
  );
  return DEMO_SESSION_SECRET;
})();

// Utility functions
export function generateId(prefix: string) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export function getDataPath(...paths: string[]): string {
  return resolveDataPath(...paths);
}
