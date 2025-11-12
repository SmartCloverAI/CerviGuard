import { randomBytes } from "crypto";
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

// Main configuration object matching ratio1-drive pattern
export const config = {
  // App-specific settings
  CASES_HKEY: env.CSTORE_CASES_HKEY ?? "cerviguard:cases",
  DEBUG: env.NODE_ENV === "development" || env.DEBUG === "true",

  // Storage configuration
  STORAGE_ROOT: env.LOCAL_STATE_DIR ?? `${process.cwd()}/.ratio1-local-state`,

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
      bootstrapAdminPassword: env.EE_CSTORE_BOOTSTRAP_ADMIN_PASS ?? null,
    },
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

// Utility function
export function generateId(prefix: string) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}
