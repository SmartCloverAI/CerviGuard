export type UserRole = "admin" | "user";

export interface UserRecord {
  id: string;
  username: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CaseResult {
  tzType: "Type 1" | "Type 2" | "Type 3";
  lesionAssessment: "none" | "low" | "moderate" | "high";
  lesionSummary: string;
  riskScore: number;
}

export interface CaseRecord {
  id: string;
  userId: string;
  imageCid: string;
  notes?: string;
  status: "processing" | "completed" | "error";
  createdAt: string;
  updatedAt: string;
  result?: CaseResult;
}

export interface CaseWithUser extends CaseRecord {
  user?: PublicUser;
}
