/**
 * Mock CStore client for local development without a real CStore backend
 * This implements the CStoreLikeClient interface required by @ratio1/cstore-auth-ts
 */

import { ensureStorageRoot, readJsonFile, writeJsonFile } from "../storage/fileStore";

interface MockCStoreData {
  [hkey: string]: {
    [key: string]: string;
  };
}

const MOCK_CSTORE_FILE = "auth-cstore.json";

export class MockCStoreClient {
  private async loadData(): Promise<MockCStoreData> {
    await ensureStorageRoot();
    return readJsonFile<MockCStoreData>(MOCK_CSTORE_FILE, {});
  }

  private async saveData(data: MockCStoreData): Promise<void> {
    await writeJsonFile(MOCK_CSTORE_FILE, data);
  }

  async hget({ hkey, key }: { hkey: string; key: string }): Promise<string | null> {
    const data = await this.loadData();
    return data[hkey]?.[key] ?? null;
  }

  async hset({ hkey, key, value }: { hkey: string; key: string; value: string }): Promise<void> {
    const data = await this.loadData();
    if (!data[hkey]) {
      data[hkey] = {};
    }
    data[hkey][key] = value;
    await this.saveData(data);
  }

  async hgetall({ hkey }: { hkey: string }): Promise<Record<string, string>> {
    const data = await this.loadData();
    return data[hkey] ?? {};
  }

  async hdel({ hkey, key }: { hkey: string; key: string }): Promise<void> {
    const data = await this.loadData();
    if (data[hkey]) {
      delete data[hkey][key];
      await this.saveData(data);
    }
  }
}
