import { randomBytes } from "crypto";
import { DEMO_SESSION_SECRET, readSessionSecretFromEnv } from "./constants/session";

const env = process.env;

const DEMO_R1FS_ENDPOINT = "https://demo-r1fs.smartclover.invalid";
const DEMO_CSTORE_ENDPOINT = "https://demo-cstore.smartclover.invalid";
const DEMO_R1EN_APP_ID = "demo-edge-app-id";
const DEMO_R1EN_APP_TOKEN = "demo-edge-app-token";

const mockFlag = env.USE_RATIO1_MOCK ?? env.USE_DECENTRALIZED_MOCK;
export const USE_MOCK_RATIO1 = mockFlag
  ? mockFlag === "true"
  : process.env.NODE_ENV !== "production";

function remoteConfigFallback(value: string, fallback: string, label: string) {
  if (value) {
    return value;
  }
  console.warn(
    `[config] ${label} is missing; using demo fallback (${fallback}). TODO: replace before deploying.`,
  );
  return fallback;
}

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

export const R1EN_BASE_URL = env.R1EN_BASE_URL ?? env.EDGE_BASE_URL ?? "";
const rawAppId = env.R1EN_APP_ID ?? env.EDGE_APP_ID ?? "";
const rawAppToken = env.R1EN_APP_TOKEN ?? env.EDGE_APP_TOKEN ?? "";
export const R1EN_APP_ID = USE_MOCK_RATIO1 ? rawAppId : remoteConfigFallback(rawAppId, DEMO_R1EN_APP_ID, "R1EN_APP_ID");
export const R1EN_APP_TOKEN = USE_MOCK_RATIO1
  ? rawAppToken
  : remoteConfigFallback(rawAppToken, DEMO_R1EN_APP_TOKEN, "R1EN_APP_TOKEN");
export const R1EN_CHAINSTORE_PEERS =
  env.R1EN_CHAINSTORE_PEERS ?? env.EE_CHAINSTORE_PEERS ?? env.CHAINSTORE_PEERS ?? "";

export const R1FS_ENDPOINT = (() => {
  if (USE_MOCK_RATIO1) {
    return "";
  }
  const provided = env.R1FS_API_URL ?? env.STORAGE_API_URL ?? "";
  const derived = R1EN_BASE_URL ? `${R1EN_BASE_URL.replace(/\/$/, "")}/r1fs` : "";
  const endpoint = provided || derived;
  return remoteConfigFallback(endpoint, DEMO_R1FS_ENDPOINT, "R1FS endpoint");
})();

export const CSTORE_ENDPOINT = (() => {
  if (USE_MOCK_RATIO1) {
    return "";
  }
  const provided = env.CSTORE_API_URL ?? env.METADATA_API_URL ?? "";
  const derived = R1EN_BASE_URL ? `${R1EN_BASE_URL.replace(/\/$/, "")}/cstore` : "";
  const endpoint = provided || derived;
  return remoteConfigFallback(endpoint, DEMO_CSTORE_ENDPOINT, "CStore endpoint");
})();

export const STORAGE_ROOT = env.LOCAL_STATE_DIR ?? `${process.cwd()}/.ratio1-local-state`;

export const CSTORE_USERS_HKEY = env.CSTORE_USERS_HKEY ?? "cerviguard:users";
export const CSTORE_USER_INDEX_HKEY = env.CSTORE_USER_INDEX_HKEY ?? "cerviguard:usernames";
export const CSTORE_CASES_HKEY = env.CSTORE_CASES_HKEY ?? "cerviguard:cases";
export const CSTORE_AUTH_HKEY = env.EE_CSTORE_AUTH_HKEY ?? env.CSTORE_AUTH_HKEY ?? null;
export const CSTORE_AUTH_SECRET = env.EE_CSTORE_AUTH_SECRET ?? env.CSTORE_AUTH_SECRET ?? null;
export const CSTORE_AUTH_BOOTSTRAP_PASSWORD =
  env.EE_CSTORE_AUTH_BOOTSTRAP_ADMIN_PW ?? env.CSTORE_AUTH_BOOTSTRAP_ADMIN_PW ?? null;

export const DEFAULT_ADMIN = {
  username: env.DEFAULT_ADMIN_USERNAME ?? "demo",
  password: env.DEFAULT_ADMIN_PASSWORD ?? "demo",
};

export const TOKEN_TTL_SECONDS = Number(env.SESSION_MAX_AGE ?? 60 * 60 * 8); // 8 hours

export function generateId(prefix: string) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}
