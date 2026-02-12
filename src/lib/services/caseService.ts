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
  const r1fs = getR1FSClient();

  // Store image in R1FS using base64 encoding
  const base64 = input.buffer.toString("base64");
  const uploadResult = await r1fs.addFileBase64({
    file_base64_str: base64,
    filename: input.filename,
  });

  const now = new Date().toISOString();

  const caseRecord: CaseRecord = {
    id: generateId("case"),
    username: input.user.username,
    imageCid: uploadResult.cid,
    status: "processing",
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };

  await cstore.createCase(caseRecord);

  try {
    console.log(`[caseService] Starting analysis for case ${caseRecord.id}`);
    console.log(`[caseService] Image details:`, {
      cid: uploadResult.cid,
      filename: input.filename,
      mimeType: input.mimeType,
      bufferSize: input.buffer.length,
    });

    const result = await runCervicalAnalysis(input.buffer);

    console.log(`[caseService] Analysis completed for case ${caseRecord.id}`);
    console.log(`[caseService] Analysis result:`, JSON.stringify(result, null, 2));

    // Handle validation error from API - store error result and mark case as error
    if (result.status === "error") {
      console.log(`[caseService] Analysis returned error for case ${caseRecord.id}: ${result.errorMessage}`);

      const errorCase = await cstore.updateCase(caseRecord.id, {
        status: "error",
        result,
      });
      return errorCase;
    }

    const completed = await cstore.updateCase(caseRecord.id, {
      status: "completed",
      result,
    });
    return completed;
  } catch (error) {
    console.error(`[caseService] Analysis failed for case ${caseRecord.id}:`, error);
    console.error(`[caseService] Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Only update case to error status if it wasn't already deleted
    try {
      const existingCase = await cstore.getCase(caseRecord.id);
      if (existingCase) {
        await cstore.updateCase(caseRecord.id, {
          status: "error",
        });
      }
    } catch {
      // Case was already deleted or doesn't exist
    }

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
    user: mapped.get(caseRecord.username),
  }));
}

export async function deleteCase(caseId: string): Promise<void> {
  const cstore = await getCStoreClient();
  await cstore.deleteCase(caseId);
}
