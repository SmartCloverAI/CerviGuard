import { config } from "../config";
import { readBinaryFile, storeBinaryFile } from "../storage/fileStore";
import path from "path";
import { getEdgeSdk } from "./sdk";

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
  private async getSdk() {
    return getEdgeSdk();
  }

  async store(bytes: Buffer, filename: string, mimeType: string): Promise<R1FSStoreResult> {
    const sdk = await this.getSdk();
    const result = await sdk.r1fs.addFile({
      file: bytes,
      filename,
      contentType: mimeType,
    });
    return { cid: result.cid };
  }

  async fetch(cid: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const sdk = await this.getSdk();
    const result = await sdk.r1fs.getFile({ cid });

    if (result instanceof Response) {
      const mimeType = result.headers.get("content-type") ?? "application/octet-stream";
      const arrayBuffer = await result.arrayBuffer();
      return { buffer: Buffer.from(arrayBuffer), mimeType };
    }

    if (result?.file_base64_str) {
      const mimeType =
        result.meta?.filename && result.meta.filename.endsWith(".png")
          ? "image/png"
          : result.meta?.filename && (result.meta.filename.endsWith(".jpg") || result.meta.filename.endsWith(".jpeg"))
            ? "image/jpeg"
            : result.meta?.filename && result.meta.filename.endsWith(".webp")
              ? "image/webp"
              : "application/octet-stream";
      return { buffer: Buffer.from(result.file_base64_str, "base64"), mimeType };
    }

    throw new Error("Unexpected R1FS response format");
  }
}

let clientPromise: Promise<R1FSClient> | null = null;

export function getR1FSClient(): Promise<R1FSClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      // Use mock mode if no R1FS API URL is configured
      if (!config.r1fsApiUrl) {
        return new LocalR1FSClient();
      }
      return new RemoteR1FSClient();
    })();
  }
  return clientPromise;
}
