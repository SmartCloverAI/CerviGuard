import { config } from "../config";
import type { CaseResult, ClassificationResult, ImageInfo, Prediction } from "../types";

interface ApiPrediction {
  label: string;
  confidence: number;
  class_id: number;
}

interface ApiClassificationResult {
  predictions: ApiPrediction[];
  top_label: string;
  top_confidence: number;
}

interface CerviguardApiResponse {
  result: {
    status: "completed" | "error";
    request_id: string;
    analysis?: {
      lesion: ApiClassificationResult;
      transformation_zone: ApiClassificationResult;
    };
    image_info: {
      valid: boolean;
      width: number;
      height: number;
      channels: number;
    };
    // Error fields
    error?: string;
    error_code?: string;
    error_type?: string;
    error_message?: string;
    processed_at: number;
    processor_version: string;
  };
}

function mapPredictions(apiPredictions: ApiPrediction[]): Prediction[] {
  return apiPredictions.map((p) => ({
    label: p.label,
    confidence: p.confidence,
    classId: p.class_id,
  }));
}

function mapClassificationResult(apiResult: ApiClassificationResult): ClassificationResult {
  return {
    predictions: mapPredictions(apiResult.predictions),
    topLabel: apiResult.top_label,
    topConfidence: apiResult.top_confidence,
  };
}

function validateAndMapResponse(data: CerviguardApiResponse["result"]): CaseResult {
  if (!data.image_info) {
    throw new Error("API did not return image info");
  }

  const imageInfo: ImageInfo = {
    valid: data.image_info.valid,
    width: data.image_info.width,
    height: data.image_info.height,
    channels: data.image_info.channels,
  };

  // Handle error response
  if (data.status === "error") {
    return {
      status: "error",
      imageInfo,
      requestId: data.request_id,
      processedAt: data.processed_at,
      processorVersion: data.processor_version,
      error: data.error,
      errorCode: data.error_code,
      errorType: data.error_type,
      errorMessage: data.error_message,
    };
  }

  // Handle success response
  if (!data.analysis) {
    throw new Error("API did not return analysis data");
  }

  if (!data.analysis.lesion?.predictions) {
    console.error('[analyzer] Missing lesion data:', JSON.stringify(data.analysis.lesion, null, 2));
    throw new Error("API did not return lesion predictions");
  }

  if (!data.analysis.transformation_zone?.predictions) {
    console.error('[analyzer] Missing TZ data:', JSON.stringify(data.analysis.transformation_zone, null, 2));
    throw new Error("API did not return transformation zone predictions");
  }

  return {
    status: "completed",
    lesion: mapClassificationResult(data.analysis.lesion),
    transformationZone: mapClassificationResult(data.analysis.transformation_zone),
    imageInfo,
    requestId: data.request_id,
    processedAt: data.processed_at,
    processorVersion: data.processor_version,
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

    const result = validateAndMapResponse(data.result);
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
