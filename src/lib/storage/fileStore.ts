import { mkdir, readFile, writeFile, access, readdir, rm } from "fs/promises";
import { constants as fsConstants } from "fs";
import path from "path";
import { createHash } from "crypto";
import { STORAGE_ROOT } from "../config";

async function ensureDir(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

export async function ensureStorageRoot() {
  await ensureDir(STORAGE_ROOT);
}

function resolvePath(...segments: string[]) {
  return path.join(STORAGE_ROOT, ...segments);
}

async function fileExists(filePath: string) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  await ensureStorageRoot();
  const filePath = resolvePath(filename);

  if (!(await fileExists(filePath))) {
    await writeJsonFile(filename, fallback);
    return structuredClone(fallback);
  }

  const contents = await readFile(filePath, "utf-8");
  try {
    return JSON.parse(contents) as T;
  } catch (error) {
    console.warn(`Failed to parse ${filename}, recreating`, error);
    await writeJsonFile(filename, fallback);
    return structuredClone(fallback);
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureStorageRoot();
  const filePath = resolvePath(filename);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function storeBinaryFile(buffer: Buffer, extension: string) {
  await ensureStorageRoot();
  const cid = createHash("sha256").update(buffer).digest("hex");
  const folder = resolvePath("r1fs");
  await ensureDir(folder);

  const filename = `${cid}${extension ? `.${extension.replace(/^\./, "")}` : ""}`;
  const filePath = path.join(folder, filename);
  await writeFile(filePath, buffer);

  return { cid, filePath };
}

export async function readBinaryFile(cid: string) {
  const folder = resolvePath("r1fs");
  await ensureDir(folder);
  const entries = await readdir(folder);
  const match = entries.find((entry) => entry.startsWith(cid));
  if (!match) {
    throw new Error(`File with CID ${cid} not found in mock storage.`);
  }
  const filePath = path.join(folder, match);
  const file = await readFile(filePath);
  const ext = path.extname(filePath).replace(/^\./, "");
  return { file, extension: ext };
}

export async function removeBinaryFile(cid: string) {
  const folder = resolvePath("r1fs");
  await ensureDir(folder);
  const entries = await readdir(folder);
  const match = entries.find((entry) => entry.startsWith(cid));
  if (match) {
    await rm(path.join(folder, match));
  }
}
