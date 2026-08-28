export const SESSION_SECRET_ENV_SOURCES = [
  "SESSION_SECRET",
  "EE_SESSION_SECRET",
  "EDGE_SESSION_SECRET",
] as const;

export const DEMO_SESSION_SECRET = "demo-session-secret-change-me";
export const MINIMUM_PRODUCTION_SESSION_SECRET_LENGTH = 32;

export function readSessionSecretFromEnv(
  env: Record<string, string | undefined>,
): string | undefined {
  for (const key of SESSION_SECRET_ENV_SOURCES) {
    const value = env[key];
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function resolveSessionSecret(
  env: Record<string, string | undefined>,
  isProduction = env.NODE_ENV === "production",
): string {
  const secret = readSessionSecretFromEnv(env);

  if (isProduction) {
    if (
      !secret ||
      secret === DEMO_SESSION_SECRET ||
      secret.length < MINIMUM_PRODUCTION_SESSION_SECRET_LENGTH
    ) {
      throw new Error(
        `A server-only session secret of at least ${MINIMUM_PRODUCTION_SESSION_SECRET_LENGTH} characters is required in production.`,
      );
    }
    return secret;
  }

  return secret ?? DEMO_SESSION_SECRET;
}
