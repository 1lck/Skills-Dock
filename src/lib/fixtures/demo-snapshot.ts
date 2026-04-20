import {
  type SkillDetail,
  type SkillSnapshot,
  type SourceRecord,
  makeSkillId,
  makeSourceId,
} from "../models/skill";

function makeSource(
  name: string,
  toolKind: SourceRecord["toolKind"],
  sourceType: SourceRecord["sourceType"],
  rootPath: string,
  status: SourceRecord["status"],
): SourceRecord {
  return {
    id: makeSourceId(toolKind, rootPath),
    name,
    toolKind,
    sourceType,
    rootPath,
    status,
    lastIndexedAt: "2026-04-20T12:00:00.000Z",
  };
}

function makeSkill(
  source: SourceRecord,
  name: string,
  relativePath: string,
  preview: string,
  status: SkillDetail["status"],
  compatibility: SkillDetail["compatibility"],
  content: string,
  issueMessage?: string,
): SkillDetail {
  return {
    id: makeSkillId(source.id, relativePath),
    name,
    toolKind: source.toolKind,
    sourceId: source.id,
    sourcePath: source.rootPath,
    skillPath: `${source.rootPath}/${relativePath}`,
    skillFilePath: `${source.rootPath}/${relativePath}/SKILL.md`,
    detectedFormat: "skill-md",
    compatibility,
    status,
    issues: issueMessage
      ? [{ code: "missing-title", message: issueMessage, severity: "warning" }]
      : [],
    preview,
    updatedAt: "2026-04-20T12:00:00.000Z",
    content,
    contentHash: `${source.toolKind}:${relativePath}`,
    relatedFiles: [],
  };
}

export function buildDemoSnapshot(customRoots: string[]): SkillSnapshot {
  const codex = makeSource("Codex Skills", "codex", "builtin", "/Users/demo/.codex/skills", "ready");
  const superpowers = makeSource(
    "Codex Superpowers",
    "codex",
    "builtin",
    "/Users/demo/.codex/superpowers/skills",
    "ready",
  );
  const claude = makeSource("Claude Skills", "claude", "builtin", "/Users/demo/.claude/skills", "warning");
  const gemini = makeSource("Gemini Skills", "gemini", "builtin", "/Users/demo/.gemini/skills", "ready");
  const opencode = makeSource(
    "OpenCode Skills",
    "opencode",
    "builtin",
    "/Users/demo/.opencode/skills",
    "ready",
  );
  const customSources = customRoots.map((rootPath, index) =>
    makeSource(`Custom ${index + 1}`, "generic", "custom", rootPath, "ready"),
  );

  const sources = [codex, superpowers, claude, gemini, opencode, ...customSources];
  const skills: SkillDetail[] = [
    makeSkill(
      codex,
      "Error Resolver",
      "error-resolver",
      "Systematic error diagnosis and resolution using first-principle analysis.",
      "valid",
      "codex",
      "# Error Resolver\n\nSystematic error diagnosis and resolution using first-principle analysis.",
    ),
    makeSkill(
      superpowers,
      "brainstorming",
      "brainstorming",
      "Explores user intent, requirements and design before implementation.",
      "valid",
      "codex",
      "# brainstorming\n\nExplores user intent, requirements and design before implementation.",
    ),
    makeSkill(
      claude,
      "documentation-lookup",
      "documentation-lookup",
      "Fetches current documentation when code depends on external libraries.",
      "warning",
      "claude",
      "Fetches current documentation when code depends on external libraries.",
      "No markdown heading or frontmatter name was found.",
    ),
    makeSkill(
      gemini,
      "gemini-executor",
      "gemini-executor",
      "Runs Gemini-focused workflows and shared agent tasks.",
      "valid",
      "gemini",
      "# gemini-executor\n\nRuns Gemini-focused workflows and shared agent tasks.",
    ),
    makeSkill(
      opencode,
      "opencode-bootstrap",
      "opencode-bootstrap",
      "Bootstraps OpenCode-specific workspace conventions.",
      "valid",
      "opencode",
      "# opencode-bootstrap\n\nBootstraps OpenCode-specific workspace conventions.",
    ),
    ...customSources.map((source, index) =>
      makeSkill(
        source,
        `Imported Skill ${index + 1}`,
        `imported-skill-${index + 1}`,
        "Imported from a custom folder added by the user.",
        "valid",
        "unknown",
        `# Imported Skill ${index + 1}\n\nImported from a custom folder added by the user.`,
      ),
    ),
  ];

  return { sources, skills };
}
