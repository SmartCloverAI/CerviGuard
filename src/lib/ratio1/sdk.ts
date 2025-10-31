import createEdgeSdk, { type EdgeSdk, type EdgeSdkOptions } from "@ratio1/edge-sdk-ts";
import { CSTORE_ENDPOINT, R1EN_APP_ID, R1EN_APP_TOKEN, R1EN_CHAINSTORE_PEERS, R1FS_ENDPOINT } from "../config";

let sdk: EdgeSdk | null = null;

type HttpAdapter = {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
};

function parsePeers(value: string): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
    }
  } catch {
    const items = value.split(",").map((entry) => entry.trim());
    if (items.every((entry) => entry.length > 0)) {
      return items;
    }
  }
  return [];
}

function createHttpAdapter(): HttpAdapter {
  return {
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers ?? {});
      if (R1EN_APP_ID) {
        headers.set("X-R1-App", R1EN_APP_ID);
      }
      if (R1EN_APP_TOKEN) {
        headers.set("Authorization", `Bearer ${R1EN_APP_TOKEN}`);
      }
      return fetch(url, {
        ...init,
        headers,
      });
    },
  };
}

export function getEdgeSdk(): EdgeSdk {
  if (!sdk) {
    const options: EdgeSdkOptions = {
      httpAdapter: createHttpAdapter(),
    };
    if (CSTORE_ENDPOINT) {
      options.cstoreUrl = CSTORE_ENDPOINT;
    }
    if (R1FS_ENDPOINT) {
      options.r1fsUrl = R1FS_ENDPOINT;
    }
    const peers = parsePeers(R1EN_CHAINSTORE_PEERS);
    if (peers.length > 0) {
      options.chainstorePeers = peers;
    }
    sdk = createEdgeSdk(options);
  }
  return sdk;
}
