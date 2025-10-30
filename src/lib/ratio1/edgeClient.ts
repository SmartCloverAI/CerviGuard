import { R1EN_APP_ID, R1EN_APP_TOKEN } from "../config";

export function withEdgeAuth(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers ?? {});
  headers.set("X-R1-App", R1EN_APP_ID);
  headers.set("Authorization", `Bearer ${R1EN_APP_TOKEN}`);
  return {
    ...init,
    headers,
  };
}

export async function edgeFetch(input: string, init?: RequestInit) {
  return fetch(input, withEdgeAuth(init));
}
