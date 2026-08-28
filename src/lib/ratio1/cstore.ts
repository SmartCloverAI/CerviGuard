import { config } from "../config";
import type { CaseRecord } from "../types";
import { getEdgeSdk } from "./sdk";
import { JsonCStoreClient } from "./json-cstore-client";

export interface CStoreClient {
  readonly supportsCaseDeletion: boolean;
  createCase(record: CaseRecord): Promise<void>;
  updateCase(caseId: string, updates: Partial<CaseRecord>): Promise<CaseRecord>;
  deleteCase(caseId: string): Promise<void>;
  getCase(caseId: string): Promise<CaseRecord | null>;
  listCasesForUser(username: string): Promise<CaseRecord[]>;
  listAllCases(): Promise<CaseRecord[]>;
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
  readonly supportsCaseDeletion = false;
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

  async deleteCase(caseId: string): Promise<void> {
    throw new Error(`Case deletion is unsupported by the configured CStore backend (${caseId}).`);
  }

  async getCase(caseId: string): Promise<CaseRecord | null> {
    const sdk = await this.getSdk();
    const raw = await sdk.cstore.hget({ hkey: config.CASES_HKEY, key: caseId });
    return parseRecord<CaseRecord>(raw);
  }

  async listCasesForUser(username: string): Promise<CaseRecord[]> {
    return (await this.listAllCases()).filter((record) => record.username === username);
  }

  async listAllCases(): Promise<CaseRecord[]> {
    const sdk = await this.getSdk();
    const records = await sdk.cstore.hgetall({ hkey: config.CASES_HKEY });
    return Object.values(records)
      .map((value) => parseRecord<CaseRecord>(value))
      .filter((record): record is CaseRecord => Boolean(record));
  }
}

let clientInstance: CStoreClient | null = null;

export function getCStoreClient(): Promise<CStoreClient> {
  if (!clientInstance) {
    if (config.useLocal) {
      clientInstance = new JsonCStoreClient();
    } else {
      clientInstance = new RemoteCStoreClient();
    }
  }
  return Promise.resolve(clientInstance);
}
