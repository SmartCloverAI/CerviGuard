import { config } from "../config";
import { getEdgeSdk } from "./sdk";
import { LocalFileClient } from "./local-file-client";

export interface R1FSClient {
  addFileBase64(params: {
    file_base64_str: string;
    filename: string;
  }): Promise<{ cid: string }>;
  getFile(params: { cid: string }): Promise<{
    file_base64_str?: string;
    meta?: { filename?: string };
  } | Response | null>;
}

let clientInstance: R1FSClient | null = null;

export function getR1FSClient(): R1FSClient {
  if (!clientInstance) {
    if (config.useLocal) {
      clientInstance = new LocalFileClient();
    } else {
      clientInstance = getEdgeSdk().r1fs as R1FSClient;
    }
  }
  return clientInstance;
}
