import { CStoreAuth, resolveAuthEnv } from "@ratio1/cstore-auth-ts";
import { config } from "../config";

const AUTH_OVERRIDES: Partial<Record<"hkey" | "secret", string>> = {};

if (config.auth.cstore.hkey) {
  AUTH_OVERRIDES.hkey = config.auth.cstore.hkey;
}

if (config.auth.cstore.secret) {
  AUTH_OVERRIDES.secret = config.auth.cstore.secret;
}

let authClient: CStoreAuth | null = null;
let initPromise: Promise<void> | null = null;

export function getAuthClient(): CStoreAuth {
  console.log("#1111");
  console.log(process.env);
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
