import { describe, expect, test } from "vitest";

import type { SkillDetail, SkillSnapshot, SourceRecord } from "../models/skill";
import { getSourceIdsForToolKinds, mergePartialSnapshot } from "./skills-refresh";

const now = "2026-04-20T12:00:00.000Z";

const sources: SourceRecord[] = [
  {
    id: "codex::/Users/demo/.codex/skills",
    name: "Codex Skills",
    toolKind: "codex",
    sourceType: "builtin",
    rootPath: "/Users/demo/.codex/skills",
    status: "ready",
    lastIndexedAt: now,
  },
  {
    id: "claude::/Users/demo/.claude/skills",
    name: "Claude Skills",
    toolKind: "claude",
    sourceType: "builtin",
    rootPath: "/Users/demo/.claude/skills",
    status: "ready",
    lastIndexedAt: now,
  },
];

const skills: SkillDetail[] = [
  {
    id: "codex::frontend",
    name: "Frontend Skill",
    toolKind: "codex",
    sourceId: sources[0].id,
    sourcePath: sources[0].rootPath,
    skillPath: "/Users/demo/.codex/skills/frontend-skill",
    skillFilePath: "/Users/demo/.codex/skills/frontend-skill/SKILL.md",
    detectedFormat: "skill-md",
    compatibility: "codex",
    status: "valid",
    pathKind: "directory",
    issues: [],
    preview: "Build modern interfaces.",
    updatedAt: now,
    content: "# Frontend Skill",
    contentHash: "hash-codex",
    relatedFiles: [],
  },
  {
    id: "claude::frontend",
    name: "Frontend Skill",
    toolKind: "claude",
    sourceId: sources[1].id,
    sourcePath: sources[1].rootPath,
    skillPath: "/Users/demo/.claude/skills/frontend-skill",
    skillFilePath: "/Users/demo/.claude/skills/frontend-skill/SKILL.md",
    detectedFormat: "skill-md",
    compatibility: "claude",
    status: "valid",
    pathKind: "directory",
    issues: [],
    preview: "Build modern interfaces.",
    updatedAt: now,
    content: "# Frontend Skill",
    contentHash: "hash-claude",
    relatedFiles: [],
  },
];

describe("skills refresh helpers", () => {
  test("finds source ids for a subset of tool kinds", () => {
    expect(getSourceIdsForToolKinds(sources, ["claude"])).toEqual([sources[1].id]);
  });

  test("merges a partial snapshot without dropping untouched sources", () => {
    const partialSnapshot: SkillSnapshot = {
      sources: [
        {
          ...sources[1],
          status: "warning",
          lastIndexedAt: "2026-04-21T09:00:00.000Z",
        },
      ],
      skills: [
        {
          ...skills[1],
          contentHash: "hash-claude-new",
          updatedAt: "2026-04-21T09:00:00.000Z",
        },
      ],
    };

    const merged = mergePartialSnapshot(sources, skills, partialSnapshot);

    expect(merged.sources).toHaveLength(2);
    expect(merged.skills).toHaveLength(2);
    expect(
      merged.sources.find((source) => source.id === sources[0].id)?.status,
    ).toBe("ready");
    expect(
      merged.skills.find((skill) => skill.sourceId === sources[1].id)?.contentHash,
    ).toBe("hash-claude-new");
  });
});
