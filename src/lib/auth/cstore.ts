import { CStoreAuth, resolveAuthEnv } from "@ratio1/cstore-auth-ts";
import { CSTORE_AUTH_HKEY, CSTORE_AUTH_SECRET } from "../config";

const AUTH_OVERRIDES: Partial<Record<"hkey" | "secret", string>> = {};

if (CSTORE_AUTH_HKEY) {
  AUTH_OVERRIDES.hkey = CSTORE_AUTH_HKEY;
}

if (CSTORE_AUTH_SECRET) {
  AUTH_OVERRIDES.secret = CSTORE_AUTH_SECRET;
}

let authClient: CStoreAuth | null = null;
let initPromise: Promise<void> | null = null;

export function getAuthClient(): CStoreAuth {
  if (!authClient) {
    const resolved = resolveAuthEnv(AUTH_OVERRIDES, process.env);
    authClient = new CStoreAuth({
      hkey: resolved.hkey,
      secret: resolved.secret,
      logger: console,
    });
  }
  return authClient;
}

export async function ensureAuthInitialized(client: CStoreAuth = getAuthClient()): Promise<void> {
  if (!initPromise) {
    initPromise = client.simple.init().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  await initPromise;
}
