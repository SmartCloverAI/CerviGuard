import { randomUUID } from "crypto";
import { CSTORE_ENDPOINT, DEFAULT_ADMIN, USE_MOCK_RATIO1 } from "../config";
import type { CaseRecord, PublicUser, UserRecord, UserRole } from "../types";
import { ensureStorageRoot, readJsonFile, writeJsonFile } from "../storage/fileStore";
import bcrypt from "bcryptjs";
import { edgeFetch } from "./edgeClient";

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

class RemoteCStoreClient implements CStoreClient {
  private baseUrl: string;

  constructor(endpoint: string) {
    this.baseUrl = endpoint.replace(/\/$/, "");
  }

  private async request<T>(path: string, init?: RequestInit) {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await edgeFetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`CStore request failed: ${response.status} ${body}`);
    }
    return (await response.json()) as T;
  }

  getUserByUsername(username: string): Promise<UserRecord | null> {
    return this.request<UserRecord | null>("/users/getByUsername", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  }

  getUserById(id: string): Promise<UserRecord | null> {
    return this.request<UserRecord | null>("/users/getById", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  }

  listUsers(): Promise<PublicUser[]> {
    return this.request<PublicUser[]>("/users/list", { method: "GET" });
  }

  createUser(input: CreateUserInput): Promise<PublicUser> {
    return this.request<PublicUser>("/users/create", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateUserPassword(input: UpdateUserPasswordInput): Promise<PublicUser> {
    return this.request<PublicUser>("/users/updatePassword", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  createCase(record: CaseRecord): Promise<void> {
    return this.request("/cases/create", {
      method: "POST",
      body: JSON.stringify(record),
    });
  }

  updateCase(caseId: string, updates: Partial<CaseRecord>): Promise<CaseRecord> {
    return this.request<CaseRecord>("/cases/update", {
      method: "POST",
      body: JSON.stringify({ caseId, updates }),
    });
  }

  getCase(caseId: string): Promise<CaseRecord | null> {
    return this.request<CaseRecord | null>("/cases/get", {
      method: "POST",
      body: JSON.stringify({ caseId }),
    });
  }

  listCasesForUser(userId: string): Promise<CaseRecord[]> {
    return this.request<CaseRecord[]>("/cases/listByUser", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  listAllCases(): Promise<CaseRecord[]> {
    return this.request<CaseRecord[]>("/cases/listAll", {
      method: "GET",
    });
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
      return new RemoteCStoreClient(CSTORE_ENDPOINT);
    })();
  }
  return clientPromise;
}
