export type AiSummaryProvider = "codex" | "claude";

export type AiSummaryStatus =
  | "idle"
  | "running"
  | "complete"
  | "error"
  | "unavailable";

export interface AiSummaryResult {
  titleZh: string;
  summaryZh: string;
  translatedMarkdownZh: string;
  generatedAt: string;
  provider: AiSummaryProvider;
}

export interface AiSummaryState {
  status: AiSummaryStatus;
  availableProviders: AiSummaryProvider[];
  provider: AiSummaryProvider | null;
  result: AiSummaryResult | null;
  error: string | null;
}

export interface AiSummaryRequest {
  skillName: string;
  contentHash: string;
  content: string;
  provider: AiSummaryProvider | null;
}
