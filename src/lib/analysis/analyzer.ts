import { createHash } from "crypto";
import type { CaseResult } from "../types";

const TZ_TYPES: CaseResult["tzType"][] = ["Type 1", "Type 2", "Type 3"];
const LESION_LEVELS: CaseResult["lesionAssessment"][] = ["none", "low", "moderate", "high"];

function hashBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest();
}

export function runCervicalAnalysis(buffer: Buffer): CaseResult {
  console.log('[analyzer] Running cervical analysis (mock)');
  console.log('[analyzer] Input buffer size:', buffer.length, 'bytes');

  // TODO: When integrating real API, replace this mock with:
  // 1. Call POST /predict endpoint with base64 encoded image
  // 2. Log the raw API response: console.log('[analyzer] API response:', response)
  // 3. Map response.result.analysis to CaseResult format
  // See API_MAPPING.md for field mappings

  const digest = hashBuffer(buffer);
  const tzIndex = digest[0] % TZ_TYPES.length;
  const lesionIndex = digest[1] % LESION_LEVELS.length;

  const riskScore = Math.round((digest[2] / 255) * 100);
  const tzType = TZ_TYPES[tzIndex];
  const lesionAssessment = LESION_LEVELS[lesionIndex];

  const lesionSummary =
    lesionAssessment === "none"
      ? "No suspicious lesion signatures detected."
      : lesionAssessment === "low"
        ? "Focal areas with low-likelihood lesions. Recommend standard follow-up."
        : lesionAssessment === "moderate"
          ? "Patterns consistent with moderate risk lesion. Recommend colposcopic evaluation."
          : "High-likelihood lesion detected. Prioritize urgent review and possible biopsy.";

  // Mock image info (matching backend structure: analysis.image_info)
  const imageWidth = 1024 + (digest[3] % 512);
  const imageHeight = 768 + (digest[4] % 384);
  const imageChannels = 3; // RGB
  const imageSizeMb = ((digest[7] % 50 + 10) / 10).toFixed(2); // 1.0 - 6.0 MB

  // Mock image quality (from analysis top-level)
  const qualityOptions = ["excellent", "good", "fair", "poor"];
  const imageQuality = qualityOptions[digest[5] % qualityOptions.length];
  const imageQualitySufficient = digest[6] > 50; // ~80% chance of sufficient quality

  const result = {
    tzType,
    lesionAssessment,
    lesionSummary,
    riskScore,
    imageQuality,
    imageQualitySufficient,
    imageWidth,
    imageHeight,
    imageChannels,
    imageSizeMb,
  };

  console.log('[analyzer] Generated mock result:', result);

  return result;
}
