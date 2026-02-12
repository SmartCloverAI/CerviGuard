import { type PublicUser } from "@ratio1/cstore-auth-ts";
import { getCStoreClient } from "../ratio1/cstore";
import { getR1FSClient } from "../ratio1/r1fs";
import { generateId } from "../config";
import { runCervicalAnalysis } from "../analysis/analyzer";
import { listUsers } from "./userService";
import type { CaseRecord, CaseWithUser } from "../types";

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

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

  // Run analysis first before storing anything
  console.log(`[caseService] Starting analysis for new case`);
  console.log(`[caseService] Image details:`, {
    filename: input.filename,
    mimeType: input.mimeType,
    bufferSize: input.buffer.length,
  });

  const result = await runCervicalAnalysis(input.buffer);

  console.log(`[caseService] Analysis completed`);
  console.log(`[caseService] Analysis result:`, JSON.stringify(result, null, 2));

  // Handle validation error - don't save the case
  if (result.status === "error" && result.errorType === "validation") {
    console.log(`[caseService] Validation failed: ${result.errorMessage}`);
    throw new ImageValidationError(
      result.errorMessage || "The uploaded image does not appear to be a valid cervical image."
    );
  }

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
    status: result.status === "error" ? "error" : "completed",
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    result,
  };

  await cstore.createCase(caseRecord);
  console.log(`[caseService] Case ${caseRecord.id} saved with status: ${caseRecord.status}`);

  return caseRecord;
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
