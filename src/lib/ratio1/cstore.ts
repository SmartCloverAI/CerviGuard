import { randomUUID } from "crypto";
import { config } from "../config";
import type { CaseRecord } from "../types";
import { ensureStorageRoot, readJsonFile, writeJsonFile } from "../storage/fileStore";
import { getEdgeSdk } from "./sdk";

export interface CStoreClient {
  createCase(record: CaseRecord): Promise<void>;
  updateCase(caseId: string, updates: Partial<CaseRecord>): Promise<CaseRecord>;
  getCase(caseId: string): Promise<CaseRecord | null>;
  listCasesForUser(userId: string): Promise<CaseRecord[]>;
  listAllCases(): Promise<CaseRecord[]>;
}

interface PersistedState {
  cases: CaseRecord[];
}

const STATE_FILE = "cstore.json";

class LocalCStoreClient implements CStoreClient {
  private async loadState(): Promise<PersistedState> {
    await ensureStorageRoot();
    const initial: PersistedState = {
      cases: [],
    };
    return readJsonFile<PersistedState>(STATE_FILE, initial);
  }

  private async writeState(state: PersistedState) {
    await writeJsonFile(STATE_FILE, state);
  }

  async createCase(record: CaseRecord): Promise<void> {
    const state = await this.loadState();
    state.cases.push(record);
    await this.writeState(state);
  }

  async updateCase(caseId: string, updates: Partial<CaseRecord>): Promise<CaseRecord> {
    const state = await this.loadState();
    const idx = state.cases.findIndex((c) => c.id === caseId);
    if (idx === -1) {
      throw new Error("Case not found");
    }
    const updated: CaseRecord = {
      ...state.cases[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    state.cases[idx] = updated;
    await this.writeState(state);
    return updated;
  }

  async getCase(caseId: string): Promise<CaseRecord | null> {
    const state = await this.loadState();
    return state.cases.find((record) => record.id === caseId) ?? null;
  }

  async listCasesForUser(userId: string): Promise<CaseRecord[]> {
    const state = await this.loadState();
    return state.cases.filter((record) => record.userId === userId);
  }

  async listAllCases(): Promise<CaseRecord[]> {
    const state = await this.loadState();
    return state.cases;
  }
}

function parseRecord<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Failed to parse CStore record", error);
    return null;
  }
}

class RemoteCStoreClient implements CStoreClient {
  private async getSdk() {
    return getEdgeSdk();
  }

  async createCase(record: CaseRecord): Promise<void> {
    const sdk = await this.getSdk();
    await sdk.cstore.hset({
      hkey: config.CASES_HKEY,
      key: record.id,
      value: JSON.stringify(record),
    });
  }

  async updateCase(caseId: string, updates: Partial<CaseRecord>): Promise<CaseRecord> {
    const sdk = await this.getSdk();
    const existingRaw = await sdk.cstore.hget({ hkey: config.CASES_HKEY, key: caseId });
    const existing = parseRecord<CaseRecord>(existingRaw);
    if (!existing) {
      throw new Error("Case not found");
    }
    const updated: CaseRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await sdk.cstore.hset({
      hkey: config.CASES_HKEY,
      key: caseId,
      value: JSON.stringify(updated),
    });
    return updated;
  }

  async getCase(caseId: string): Promise<CaseRecord | null> {
    const sdk = await this.getSdk();
    const raw = await sdk.cstore.hget({ hkey: config.CASES_HKEY, key: caseId });
    return parseRecord<CaseRecord>(raw);
  }

  async listCasesForUser(userId: string): Promise<CaseRecord[]> {
    return (await this.listAllCases()).filter((record) => record.userId === userId);
  }

  async listAllCases(): Promise<CaseRecord[]> {
    const sdk = await this.getSdk();
    const records = await sdk.cstore.hgetall({ hkey: config.CASES_HKEY });
    return Object.values(records)
      .map((value) => parseRecord<CaseRecord>(value))
      .filter((record): record is CaseRecord => Boolean(record));
  }
}

let clientPromise: Promise<CStoreClient> | null = null;

export function getCStoreClient(): Promise<CStoreClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      // Use mock mode if no CStore API URL is configured
      if (!config.cstoreApiUrl) {
        const localClient = new LocalCStoreClient();
        return localClient;
      }
      return new RemoteCStoreClient();
    })();
  }
  return clientPromise;
}
