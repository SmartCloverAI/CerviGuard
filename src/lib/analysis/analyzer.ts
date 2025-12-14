import { config } from "../config";
import type { CaseResult } from "../types";

interface CerviguardApiAnalysis {
  tz_type: string;
  lesion_assessment: string;
  lesion_summary: string;
  risk_score: number;
  image_quality?: string;
  image_quality_sufficient?: boolean;
  image_info?: {
    width: number;
    height: number;
    channels: number;
    size_mb: string;
  };
}

interface CerviguardApiResponse {
  result: {
    status: "completed" | "error";
    request_id?: string;
    analysis?: CerviguardApiAnalysis;
    error?: string;
    processed_at?: number;
  };
}

function validateAndMapResponse(analysis: CerviguardApiAnalysis): CaseResult {
  // Validate tz_type
  const validTzTypes = ["Type 1", "Type 2", "Type 3"];
  const tzType = validTzTypes.includes(analysis.tz_type)
    ? (analysis.tz_type as CaseResult["tzType"])
    : "Type 1";

  // Validate lesion_assessment
  const validLesions = ["none", "low", "moderate", "high"];
  const lesionAssessment = validLesions.includes(analysis.lesion_assessment.toLowerCase())
    ? (analysis.lesion_assessment.toLowerCase() as CaseResult["lesionAssessment"])
    : "none";

  const lesionSummary = analysis.lesion_summary || "No analysis summary provided.";
  const riskScore = Math.min(100, Math.max(0, Math.round(analysis.risk_score || 0)));

  return {
    tzType,
    lesionAssessment,
    lesionSummary,
    riskScore,
    imageQuality: analysis.image_quality,
    imageQualitySufficient: analysis.image_quality_sufficient,
    imageWidth: analysis.image_info?.width,
    imageHeight: analysis.image_info?.height,
    imageChannels: analysis.image_info?.channels,
    imageSizeMb: analysis.image_info?.size_mb,
  };
}

export async function runCervicalAnalysis(buffer: Buffer): Promise<CaseResult> {
  console.log('[analyzer] Running cervical analysis via API');
  console.log('[analyzer] Input buffer size:', buffer.length, 'bytes');
  console.log('[analyzer] API URL:', config.cerviguardApi.baseUrl);

  const base64 = buffer.toString("base64");
  const url = `${config.cerviguardApi.baseUrl}/predict`;

  console.log('[analyzer] Sending request to:', url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.cerviguardApi.timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_data: base64,
        metadata: {
          source: "cerviguard_web_app",
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[analyzer] API response status:', response.status);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as CerviguardApiResponse;
    console.log('[analyzer] API response:', JSON.stringify(data, null, 2));

    if (data.result.status === "error") {
      throw new Error(data.result.error || "Unknown API error");
    }

    if (!data.result.analysis) {
      throw new Error("API did not return analysis data");
    }

    const result = validateAndMapResponse(data.result.analysis);
    console.log('[analyzer] Mapped result:', result);

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[analyzer] Analysis failed:', error);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(`Analysis timeout after ${config.cerviguardApi.timeout / 1000} seconds`);
      }
      throw new Error(`Analysis failed: ${error.message}`);
    }

    throw new Error("Unknown analysis error");
  }
}
