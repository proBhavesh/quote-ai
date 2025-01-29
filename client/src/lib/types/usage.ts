export interface UsageInfo {
  currentUsage: number;
  maxQuotes: number;
  canUpload: boolean;
  message?: string;
  remainingQuotes: number;
  percentageUsed: number;
  planName: string;
  isOverLimit: boolean;
  limitType: "NONE" | "MONTHLY" | "TOTAL";
}

export interface UsageError {
  code: "USAGE_LIMIT_EXCEEDED";
  message: string;
  usage: UsageInfo;
}
