import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomBytes, createHash } from "crypto";
import { config } from "../config";

interface FileMeta {
  filename: string;
  mimeType?: string;
  createdAt: string;
}

interface FileIndex {
  files: Record<string, FileMeta>;
}

export class LocalFileClient {
  private dataDir: string;
  private filesDir: string;
  private indexPath: string;

  constructor() {
    this.dataDir = join(process.cwd(), config.dataDir);
    this.filesDir = join(this.dataDir, "files");
    this.indexPath = join(this.dataDir, "files.json");

    mkdirSync(this.filesDir, { recursive: true });
  }

  private readIndex(): FileIndex {
    if (!existsSync(this.indexPath)) {
      return { files: {} };
    }
    try {
      const data = readFileSync(this.indexPath, "utf-8");
      return JSON.parse(data) as FileIndex;
    } catch {
      return { files: {} };
    }
  }

  private writeIndex(index: FileIndex): void {
    writeFileSync(this.indexPath, JSON.stringify(index, null, 2), "utf-8");
  }

  private generateCid(data: string): string {
    const hash = createHash("sha256").update(data).digest("hex").slice(0, 32);
    const random = randomBytes(4).toString("hex");
    return `local_${hash}_${random}`;
  }

  async addFileBase64(params: {
    file_base64_str: string;
    filename: string;
  }): Promise<{ cid: string }> {
    const cid = this.generateCid(params.file_base64_str);
    const filePath = join(this.filesDir, `${cid}.b64`);

    // Write the base64 content to file
    writeFileSync(filePath, params.file_base64_str, "utf-8");

    // Update index
    const index = this.readIndex();
    index.files[cid] = {
      filename: params.filename,
      createdAt: new Date().toISOString(),
    };
    this.writeIndex(index);

    return { cid };
  }

  async getFile(params: { cid: string }): Promise<{
    file_base64_str: string;
    meta?: { filename?: string };
  } | null> {
    const filePath = join(this.filesDir, `${params.cid}.b64`);

    if (!existsSync(filePath)) {
      return null;
    }

    const file_base64_str = readFileSync(filePath, "utf-8");
    const index = this.readIndex();
    const meta = index.files[params.cid];

    return {
      file_base64_str,
      meta: meta ? { filename: meta.filename } : undefined,
    };
  }
}
