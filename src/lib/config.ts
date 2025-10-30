import { createHash, randomBytes } from "crypto";

const env = process.env;

export const SESSION_SECRET = (() => {
  const secret = env.SESSION_SECRET || env.NEXT_PUBLIC_SESSION_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production environments.");
  }

  // In development we generate a deterministic secret on boot so hot-reloads keep working.
  const seed = `dev-secret-${env.USER ?? "unknown"}`;
  return createHash("sha256").update(seed).digest("hex");
})();

export const R1EN_BASE_URL = env.R1EN_BASE_URL ?? "";
export const R1EN_APP_ID = env.R1EN_APP_ID ?? "";
export const R1EN_APP_TOKEN = env.R1EN_APP_TOKEN ?? "";

const mockFlag = env.USE_RATIO1_MOCK;
export const USE_MOCK_RATIO1 = mockFlag
  ? mockFlag === "true"
  : process.env.NODE_ENV !== "production";

export const R1FS_ENDPOINT = (() => {
  if (USE_MOCK_RATIO1) {
    return "";
  }
  const provided = env.R1FS_API_URL ?? "";
  const derived = R1EN_BASE_URL ? `${R1EN_BASE_URL.replace(/\/$/, "")}/r1fs` : "";
  const endpoint = provided || derived;
  if (!endpoint) {
    throw new Error("R1FS endpoint must be configured when USE_RATIO1_MOCK is false.");
  }
  return endpoint;
})();

export const CSTORE_ENDPOINT = (() => {
  if (USE_MOCK_RATIO1) {
    return "";
  }
  const provided = env.CSTORE_API_URL ?? "";
  const derived = R1EN_BASE_URL ? `${R1EN_BASE_URL.replace(/\/$/, "")}/cstore` : "";
  const endpoint = provided || derived;
  if (!endpoint) {
    throw new Error("CStore endpoint must be configured when USE_RATIO1_MOCK is false.");
  }
  return endpoint;
})();

if (!USE_MOCK_RATIO1) {
  if (!R1EN_APP_ID) {
    throw new Error("R1EN_APP_ID must be set when USE_RATIO1_MOCK is false.");
  }
  if (!R1EN_APP_TOKEN) {
    throw new Error("R1EN_APP_TOKEN must be set when USE_RATIO1_MOCK is false.");
  }
}

export const STORAGE_ROOT =
  env.LOCAL_STATE_DIR ?? `${process.cwd()}/.ratio1-local-state`;

export const DEFAULT_ADMIN = {
  username: env.DEFAULT_ADMIN_USERNAME ?? "demo",
  password: env.DEFAULT_ADMIN_PASSWORD ?? "demo",
};

export const TOKEN_TTL_SECONDS = Number(env.SESSION_MAX_AGE ?? 60 * 60 * 8); // 8 hours

export function generateId(prefix: string) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}
