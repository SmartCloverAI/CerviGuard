export const SESSION_SECRET_ENV_SOURCES = [
  "SESSION_SECRET",
  "NEXT_PUBLIC_SESSION_SECRET",
  "EE_SESSION_SECRET",
  "EDGE_SESSION_SECRET",
] as const;

export const DEMO_SESSION_SECRET = "demo-session-secret-change-me";

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
