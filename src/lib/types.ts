// Re-export user types from auth library
export type UserRole = "admin" | "user";

export type TzType = "Type 1" | "Type 2" | "Type 3";
export type LesionLabel = "Normal" | "LSIL" | "HSIL" | "Cancer";

export interface Prediction {
  label: string;
  confidence: number;
  classId: number;
}

export interface ClassificationResult {
  predictions: Prediction[];
  topLabel: string;
  topConfidence: number;
}

export interface ImageInfo {
  valid: boolean;
  width: number;
  height: number;
  channels: number;
}

export interface CaseResult {
  // Status
  status: "completed" | "error";
  // Analysis results (only present when status is "completed")
  lesion?: ClassificationResult;
  transformationZone?: ClassificationResult;
  // Image info
  imageInfo: ImageInfo;
  // Metadata
  requestId: string;
  processedAt: number;
  processorVersion: string;
  // Error fields (only present when status is "error")
  error?: string;
  errorCode?: string;
  errorType?: string;
  errorMessage?: string;
}

export interface CaseRecord {
  id: string;
  username: string;
  imageCid: string;
  notes?: string;
  status: "completed" | "error";
  createdAt: string;
  updatedAt: string;
  result?: CaseResult;
}

export interface CaseWithUser extends CaseRecord {
  user?: {
    username: string;
    role?: string;
    createdAt?: string;
  };
}
