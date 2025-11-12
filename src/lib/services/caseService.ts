import { type PublicUser } from "@ratio1/cstore-auth-ts";
import { getCStoreClient } from "../ratio1/cstore";
import { getR1FSClient } from "../ratio1/r1fs";
import { generateId } from "../config";
import { runCervicalAnalysis } from "../analysis/analyzer";
import { listUsers } from "./userService";
import type { CaseRecord, CaseWithUser } from "../types";

export interface CreateCaseInput {
  user: PublicUser;
  buffer: Buffer;
  filename: string;
  mimeType: string;
  notes?: string;
}

export async function createCase(input: CreateCaseInput): Promise<CaseRecord> {
  const cstore = await getCStoreClient();
  const r1fs = await getR1FSClient();

  const { cid } = await r1fs.store(input.buffer, input.filename, input.mimeType);
  const now = new Date().toISOString();

  const caseRecord: CaseRecord = {
    id: generateId("case"),
    userId: input.user.username, // Use username as userId
    imageCid: cid,
    status: "processing",
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };

  await cstore.createCase(caseRecord);

  try {
    const result = runCervicalAnalysis(input.buffer);
    const completed = await cstore.updateCase(caseRecord.id, {
      status: "completed",
      result,
    });
    return completed;
  } catch (error) {
    await cstore.updateCase(caseRecord.id, {
      status: "error",
    });
    throw error;
  }
}

export async function listCasesForUser(user: PublicUser): Promise<CaseRecord[]> {
  const cstore = await getCStoreClient();
  if (user.role === "admin") {
    return cstore.listAllCases();
  }
  return cstore.listCasesForUser(user.username);
}

export async function getCaseById(caseId: string): Promise<CaseRecord | null> {
  const cstore = await getCStoreClient();
  return cstore.getCase(caseId);
}

export async function listCasesWithUsers(): Promise<CaseWithUser[]> {
  const cstore = await getCStoreClient();
  const [cases, users] = await Promise.all([cstore.listAllCases(), listUsers()]);
  const mapped = new Map(users.map((user) => [user.username, user]));
  return cases.map((caseRecord) => ({
    ...caseRecord,
    user: mapped.get(caseRecord.userId),
  }));
}
