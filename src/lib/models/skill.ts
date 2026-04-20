export type ToolKind =
  | "codex"
  | "claude"
  | "gemini"
  | "opencode"
  | "generic";
export type AppKind = Exclude<ToolKind, "generic">;
export type SourceType = "builtin" | "custom";
export type SourceStatus =
  | "ready"
  | "empty"
  | "warning"
  | "missing"
  | "unavailable";
export type SkillStatus = "valid" | "warning" | "invalid";
export type IssueSeverity = "warning" | "error";

export interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface SourceRecord {
  id: string;
  name: string;
  toolKind: ToolKind;
  sourceType: SourceType;
  rootPath: string;
  status: SourceStatus;
  lastIndexedAt: string | null;
}

export interface SourceInput {
  id: string;
  name: string;
  toolKind: ToolKind;
  sourceType: SourceType;
  rootPath: string;
}

export interface SkillSummary {
  id: string;
  name: string;
  toolKind: ToolKind;
  sourceId: string;
  sourcePath: string;
  skillPath: string;
  skillFilePath: string;
  detectedFormat: string;
  compatibility: ToolKind | "unknown";
  status: SkillStatus;
  issues: ValidationIssue[];
  preview: string;
  updatedAt: string;
}

export interface SkillDetail extends SkillSummary {
  content: string;
  contentHash: string;
  relatedFiles: string[];
}

export interface SkillSnapshot {
  sources: SourceRecord[];
  skills: SkillDetail[];
}

export interface InstalledAppState {
  claude: boolean;
  codex: boolean;
  gemini: boolean;
  opencode: boolean;
}

export interface AggregatedInstallation {
  id: string;
  toolKind: ToolKind;
  sourceId: string;
  sourcePath: string;
  skillPath: string;
  skillFilePath: string;
  status: SkillStatus;
  contentHash: string;
  updatedAt: string;
}

export interface AggregatedInstalledSkill {
  id: string;
  canonicalId: string;
  name: string;
  status: SkillStatus;
  preview: string;
  updatedAt: string;
  apps: InstalledAppState;
  installations: AggregatedInstallation[];
  primaryInstallation: SkillDetail | null;
}

export function makeSourceId(toolKind: ToolKind, rootPath: string): string {
  return `${toolKind}::${normalizeForId(rootPath)}`;
}

export function makeSkillId(sourceId: string, relativePath: string): string {
  return `${sourceId}::${normalizeForId(relativePath)}`;
}

export function deriveSkillStatus(issues: ValidationIssue[]): SkillStatus {
  if (issues.some((issue) => issue.severity === "error")) {
    return "invalid";
  }

  if (issues.length > 0) {
    return "warning";
  }

  return "valid";
}

export function makePreview(markdown: string, maxLength = 220): string {
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---\s*/u, "");
  const withoutCode = withoutFrontmatter.replace(/```[\s\S]*?```/gu, " ");
  const plainText = withoutCode
    .replace(/^#+\s*/gmu, "")
    .replace(/[*_`>-]/g, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return plainText.slice(0, maxLength).trim();
}

function normalizeForId(value: string): string {
  return value.replace(/\\/gu, "/").toLowerCase();
}
