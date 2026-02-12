import { CStoreAuth, resolveAuthEnv, type CStoreAuthOptions } from "@ratio1/cstore-auth-ts";
import { config, getDataPath } from "../config";
import { FileCStoreMock } from "./mock-cstore-client";

const BASE_AUTH_OVERRIDES: Partial<Record<"hkey" | "secret", string>> = {};

if (config.auth.cstore.hkey) {
  BASE_AUTH_OVERRIDES.hkey = config.auth.cstore.hkey;
}

if (config.auth.cstore.secret) {
  BASE_AUTH_OVERRIDES.secret = config.auth.cstore.secret;
}

let authClient: CStoreAuth | null = null;
let initPromise: Promise<void> | null = null;

export function getAuthClient(): CStoreAuth {
  if (!authClient) {
    const overrides = { ...BASE_AUTH_OVERRIDES };

    if (config.useMocks) {
      overrides.hkey ??= config.mockAuth.hkey;
      overrides.secret ??= config.mockAuth.secret;

      if (!process.env.EE_CSTORE_AUTH_BOOTSTRAP_ADMIN_PW) {
        process.env.EE_CSTORE_AUTH_BOOTSTRAP_ADMIN_PW =
          config.auth.cstore.bootstrapAdminPassword ?? config.mockAdmin.password;
      }
    }

    const resolved = resolveAuthEnv(overrides, process.env);
    const options: CStoreAuthOptions = {
      hkey: resolved.hkey,
      secret: resolved.secret,
      logger: console,
    };

    if (config.useMocks) {
      const storePath = getDataPath("auth-store.json");
      options.client = new FileCStoreMock(storePath);
    }

    authClient = new CStoreAuth(options);
  }
  return authClient;
}

export async function ensureAuthInitialized(client: CStoreAuth = getAuthClient()): Promise<void> {
  if (!initPromise) {
    initPromise = client.simple.init().catch((error) => {
      console.warn('[auth] Failed to initialize CStore auth - this is expected in local dev without a CStore backend');
      console.warn('[auth] Error:', error.message);
      initPromise = null;
      throw error;
    });
  }
  await initPromise;
}
