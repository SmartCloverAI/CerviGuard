import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { CStoreClient } from "./cstore";
import type { CaseRecord } from "../types";
import { config } from "../config";

interface CasesStore {
  cases: Record<string, CaseRecord>;
}

export class JsonCStoreClient implements CStoreClient {
  private filePath: string;

  constructor() {
    const dataDir = join(process.cwd(), config.dataDir);
    mkdirSync(dataDir, { recursive: true });
    this.filePath = join(dataDir, "cases.json");
  }

  private readStore(): CasesStore {
    if (!existsSync(this.filePath)) {
      return { cases: {} };
    }
    try {
      const data = readFileSync(this.filePath, "utf-8");
      return JSON.parse(data) as CasesStore;
    } catch {
      return { cases: {} };
    }
  }

  private writeStore(store: CasesStore): void {
    writeFileSync(this.filePath, JSON.stringify(store, null, 2), "utf-8");
  }

  async createCase(record: CaseRecord): Promise<void> {
    const store = this.readStore();
    store.cases[record.id] = record;
    this.writeStore(store);
  }

  async updateCase(
    caseId: string,
    updates: Partial<CaseRecord>
  ): Promise<CaseRecord> {
    const store = this.readStore();
    const existing = store.cases[caseId];
    if (!existing) {
      throw new Error("Case not found");
    }

    const updated: CaseRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    store.cases[caseId] = updated;
    this.writeStore(store);

    return updated;
  }

  async deleteCase(caseId: string): Promise<void> {
    const store = this.readStore();
    delete store.cases[caseId];
    this.writeStore(store);
  }

  async getCase(caseId: string): Promise<CaseRecord | null> {
    const store = this.readStore();
    return store.cases[caseId] ?? null;
  }

  async listCasesForUser(username: string): Promise<CaseRecord[]> {
    const store = this.readStore();
    return Object.values(store.cases)
      .filter((record) => record.username === username)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async listAllCases(): Promise<CaseRecord[]> {
    const store = this.readStore();
    return Object.values(store.cases).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}
