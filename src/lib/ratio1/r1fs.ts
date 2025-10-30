import { randomUUID } from "crypto";
import { R1FS_ENDPOINT, USE_MOCK_RATIO1 } from "../config";
import { readBinaryFile, storeBinaryFile } from "../storage/fileStore";
import path from "path";
import { edgeFetch } from "./edgeClient";

export interface R1FSStoreResult {
  cid: string;
  path?: string;
}

export interface R1FSClient {
  store(bytes: Buffer, filename: string, mimeType: string): Promise<R1FSStoreResult>;
  fetch(cid: string): Promise<{ buffer: Buffer; mimeType: string }>;
}

class LocalR1FSClient implements R1FSClient {
  async store(bytes: Buffer, filename: string, mimeType: string): Promise<R1FSStoreResult> {
    const extension = path.extname(filename)?.replace(/^\./, "") || mimeType.split("/")[1] || "bin";
    const { cid, filePath } = await storeBinaryFile(bytes, extension);
    return { cid, path: filePath };
  }

  async fetch(cid: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const { file, extension } = await readBinaryFile(cid);
    const mimeType =
      extension === "png"
        ? "image/png"
        : extension === "jpg" || extension === "jpeg"
          ? "image/jpeg"
          : extension === "webp"
            ? "image/webp"
            : "application/octet-stream";
    return { buffer: file, mimeType };
  }
}

class RemoteR1FSClient implements R1FSClient {
  private baseUrl: string;

  constructor(endpoint: string) {
    this.baseUrl = endpoint.replace(/\/$/, "");
  }

  async store(bytes: Buffer, filename: string, mimeType: string): Promise<R1FSStoreResult> {
    const url = `${this.baseUrl}/upload`;
    const formData = new FormData();
    const payload = new Uint8Array(bytes);
    const blob = new Blob([payload], { type: mimeType });
    formData.append("file", blob, filename);
    formData.append("requestId", randomUUID());

    const response = await edgeFetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`R1FS upload failed: ${response.status} ${body}`);
    }
    const result = (await response.json()) as { cid: string };
    return { cid: result.cid };
  }

  async fetch(cid: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const url = `${this.baseUrl}/files/${cid}`;
    const response = await edgeFetch(url, { method: "GET" });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`R1FS fetch failed: ${response.status} ${body}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") ?? "application/octet-stream";
    return { buffer: Buffer.from(arrayBuffer), mimeType };
  }
}

let clientPromise: Promise<R1FSClient> | null = null;

export function getR1FSClient(): Promise<R1FSClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      if (USE_MOCK_RATIO1) {
        return new LocalR1FSClient();
      }
      if (!R1FS_ENDPOINT) {
        throw new Error("R1FS_API_URL must be defined when mock mode is disabled.");
      }
      return new RemoteR1FSClient(R1FS_ENDPOINT);
    })();
  }
  return clientPromise;
}
