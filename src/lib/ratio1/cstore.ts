import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import {
  CSTORE_CASES_HKEY,
  CSTORE_ENDPOINT,
  CSTORE_USERS_HKEY,
  CSTORE_USER_INDEX_HKEY,
  DEFAULT_ADMIN,
  USE_MOCK_RATIO1,
} from "../config";
import type { CaseRecord, PublicUser, UserRecord, UserRole } from "../types";
import { ensureStorageRoot, readJsonFile, writeJsonFile } from "../storage/fileStore";
import { getEdgeSdk } from "./sdk";

export interface CreateUserInput {
  username: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserPasswordInput {
  userId: string;
  passwordHash: string;
}

export interface CStoreClient {
  getUserByUsername(username: string): Promise<UserRecord | null>;
  getUserById(id: string): Promise<UserRecord | null>;
  listUsers(): Promise<PublicUser[]>;
  createUser(input: CreateUserInput): Promise<PublicUser>;
  updateUserPassword(input: UpdateUserPasswordInput): Promise<PublicUser>;
  createCase(record: CaseRecord): Promise<void>;
  updateCase(caseId: string, updates: Partial<CaseRecord>): Promise<CaseRecord>;
  getCase(caseId: string): Promise<CaseRecord | null>;
  listCasesForUser(userId: string): Promise<CaseRecord[]>;
  listAllCases(): Promise<CaseRecord[]>;
}

interface PersistedState {
  users: UserRecord[];
  cases: CaseRecord[];
}

const STATE_FILE = "cstore.json";

class LocalCStoreClient implements CStoreClient {
  private async loadState(): Promise<PersistedState> {
    await ensureStorageRoot();
    const initial: PersistedState = {
      users: [],
      cases: [],
    };
    return readJsonFile<PersistedState>(STATE_FILE, initial);
  }

  private async writeState(state: PersistedState) {
    await writeJsonFile(STATE_FILE, state);
  }

  private toPublicUser(user: UserRecord): PublicUser {
    const { passwordHash, ...rest } = user;
    void passwordHash;
    return rest;
  }

  async ensureAdminSeed() {
    const state = await this.loadState();
    const hasAdmin = state.users.some((u) => u.role === "admin");
    if (!hasAdmin) {
      const now = new Date().toISOString();
      const adminRecord: UserRecord = {
        id: randomUUID(),
        username: DEFAULT_ADMIN.username,
        role: "admin",
        passwordHash: await bcrypt.hash(DEFAULT_ADMIN.password, 12),
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };
      state.users.push(adminRecord);
      await this.writeState(state);
    }
  }

  async getUserByUsername(username: string): Promise<UserRecord | null> {
    const state = await this.loadState();
    return state.users.find((user) => user.username.toLowerCase() === username.toLowerCase()) ?? null;
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    const state = await this.loadState();
    return state.users.find((user) => user.id === id) ?? null;
  }

  async listUsers(): Promise<PublicUser[]> {
    const state = await this.loadState();
    return state.users.map((user) => this.toPublicUser(user));
  }

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const state = await this.loadState();
    if (state.users.some((user) => user.username.toLowerCase() === input.username.toLowerCase())) {
      throw new Error(`User ${input.username} already exists`);
    }

    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: randomUUID(),
      username: input.username,
      role: input.role,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    state.users.push(newUser);
    await this.writeState(state);
    return this.toPublicUser(newUser);
  }

  async updateUserPassword(input: UpdateUserPasswordInput): Promise<PublicUser> {
    const state = await this.loadState();
    const user = state.users.find((candidate) => candidate.id === input.userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.passwordHash = input.passwordHash;
    user.updatedAt = new Date().toISOString();
    await this.writeState(state);
    return this.toPublicUser(user);
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

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
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

  private toPublicUser(user: UserRecord): PublicUser {
    const { passwordHash, ...rest } = user;
    void passwordHash;
    return rest;
  }

  async getUserByUsername(username: string): Promise<UserRecord | null> {
    const sdk = await this.getSdk();
    const normalized = normalizeUsername(username);
    const userId = await sdk.cstore.hget({ hkey: CSTORE_USER_INDEX_HKEY, key: normalized });
    if (!userId) {
      return null;
    }
    const rawUser = await sdk.cstore.hget({ hkey: CSTORE_USERS_HKEY, key: userId });
    return parseRecord<UserRecord>(rawUser);
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    const sdk = await this.getSdk();
    const rawUser = await sdk.cstore.hget({ hkey: CSTORE_USERS_HKEY, key: id });
    return parseRecord<UserRecord>(rawUser);
  }

  async listUsers(): Promise<PublicUser[]> {
    const sdk = await this.getSdk();
    const records = await sdk.cstore.hgetall({ hkey: CSTORE_USERS_HKEY });
    return Object.values(records)
      .map((value) => parseRecord<UserRecord>(value))
      .filter((user): user is UserRecord => Boolean(user))
      .map((user) => this.toPublicUser(user));
  }

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const sdk = await this.getSdk();
    const normalized = normalizeUsername(input.username);
    const existing = await sdk.cstore.hget({ hkey: CSTORE_USER_INDEX_HKEY, key: normalized });
    if (existing) {
      throw new Error(`User ${input.username} already exists`);
    }

    const now = new Date().toISOString();
    const user: UserRecord = {
      id: randomUUID(),
      username: input.username,
      role: input.role,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    await sdk.cstore.hset({
      hkey: CSTORE_USERS_HKEY,
      key: user.id,
      value: JSON.stringify(user),
    });

    await sdk.cstore.hset({
      hkey: CSTORE_USER_INDEX_HKEY,
      key: normalized,
      value: user.id,
    });

    return this.toPublicUser(user);
  }

  async updateUserPassword(input: UpdateUserPasswordInput): Promise<PublicUser> {
    const sdk = await this.getSdk();
    const existingRaw = await sdk.cstore.hget({ hkey: CSTORE_USERS_HKEY, key: input.userId });
    const existing = parseRecord<UserRecord>(existingRaw);
    if (!existing) {
      throw new Error("User not found");
    }
    const updated: UserRecord = {
      ...existing,
      passwordHash: input.passwordHash,
      updatedAt: new Date().toISOString(),
    };
    await sdk.cstore.hset({
      hkey: CSTORE_USERS_HKEY,
      key: updated.id,
      value: JSON.stringify(updated),
    });
    return this.toPublicUser(updated);
  }

  async createCase(record: CaseRecord): Promise<void> {
    const sdk = await this.getSdk();
    await sdk.cstore.hset({
      hkey: CSTORE_CASES_HKEY,
      key: record.id,
      value: JSON.stringify(record),
    });
  }

  async updateCase(caseId: string, updates: Partial<CaseRecord>): Promise<CaseRecord> {
    const sdk = await this.getSdk();
    const existingRaw = await sdk.cstore.hget({ hkey: CSTORE_CASES_HKEY, key: caseId });
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
      hkey: CSTORE_CASES_HKEY,
      key: caseId,
      value: JSON.stringify(updated),
    });
    return updated;
  }

  async getCase(caseId: string): Promise<CaseRecord | null> {
    const sdk = await this.getSdk();
    const raw = await sdk.cstore.hget({ hkey: CSTORE_CASES_HKEY, key: caseId });
    return parseRecord<CaseRecord>(raw);
  }

  async listCasesForUser(userId: string): Promise<CaseRecord[]> {
    return (await this.listAllCases()).filter((record) => record.userId === userId);
  }

  async listAllCases(): Promise<CaseRecord[]> {
    const sdk = await this.getSdk();
    const records = await sdk.cstore.hgetall({ hkey: CSTORE_CASES_HKEY });
    return Object.values(records)
      .map((value) => parseRecord<CaseRecord>(value))
      .filter((record): record is CaseRecord => Boolean(record));
  }
}

let clientPromise: Promise<CStoreClient> | null = null;

export function getCStoreClient(): Promise<CStoreClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      if (USE_MOCK_RATIO1) {
        const localClient = new LocalCStoreClient();
        await localClient.ensureAdminSeed();
        return localClient;
      }
      if (!CSTORE_ENDPOINT) {
        throw new Error("CSTORE_API_URL must be defined when mock mode is disabled.");
      }
      return new RemoteCStoreClient();
    })();
  }
  return clientPromise;
}
