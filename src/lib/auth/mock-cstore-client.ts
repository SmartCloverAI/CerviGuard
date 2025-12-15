import { promises as fs } from "fs";
import { dirname } from "path";
import type { CStoreLikeClient } from "@ratio1/cstore-auth-ts";

interface MockStore {
  [hkey: string]: Record<string, string>;
}

async function readStore(filePath: string): Promise<MockStore> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as MockStore;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[mock-auth] Failed to read auth store, resetting to empty state.", error);
    }
  }
  return {};
}

async function writeStore(filePath: string, data: MockStore) {
  await fs.mkdir(dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export class FileCStoreMock implements CStoreLikeClient {
  constructor(private readonly filePath: string) {}

  async hget(hkey: string, key: string): Promise<string | null> {
    const store = await readStore(this.filePath);
    return store[hkey]?.[key] ?? null;
  }

  async hset(hkey: string, key: string, value: string): Promise<void> {
    const store = await readStore(this.filePath);
    if (!store[hkey]) {
      store[hkey] = {};
    }
    store[hkey][key] = value;
    await writeStore(this.filePath, store);
  }

  async hgetAll(hkey: string): Promise<Record<string, string>> {
    const store = await readStore(this.filePath);
    return store[hkey] ?? {};
  }
}
