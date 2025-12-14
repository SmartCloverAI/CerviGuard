// Re-export user types from auth library
export type UserRole = "admin" | "user";

export interface CaseResult {
  tzType: "Type 1" | "Type 2" | "Type 3";
  lesionAssessment: "none" | "low" | "moderate" | "high";
  lesionSummary: string;
  riskScore: number;
  imageQuality?: string;
  imageQualitySufficient?: boolean;
  // Image info (from analysis.image_info)
  imageWidth?: number;
  imageHeight?: number;
  imageChannels?: number;
  imageSizeMb?: string;
}

export interface CaseRecord {
  id: string;
  username: string;
  imageCid: string;
  notes?: string;
  status: "processing" | "completed" | "error";
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
