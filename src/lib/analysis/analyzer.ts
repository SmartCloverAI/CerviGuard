import { createHash } from "crypto";
import type { CaseResult } from "../types";

const TZ_TYPES: CaseResult["tzType"][] = ["Type 1", "Type 2", "Type 3"];
const LESION_LEVELS: CaseResult["lesionAssessment"][] = ["none", "low", "moderate", "high"];

function hashBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest();
}

export function runCervicalAnalysis(buffer: Buffer): CaseResult {
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

  return {
    tzType,
    lesionAssessment,
    lesionSummary,
    riskScore,
  };
}
