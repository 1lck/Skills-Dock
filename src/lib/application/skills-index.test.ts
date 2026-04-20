import { describe, expect, test } from "vitest";

import type { SkillSummary, SourceRecord } from "../models/skill";
import { filterSkills, groupSources, sortSkills } from "./skills-index";

const sources: SourceRecord[] = [
  {
    id: "codex::/users/lick/.codex/skills",
    name: "Codex Skills",
    toolKind: "codex",
    sourceType: "builtin",
    rootPath: "/Users/lick/.codex/skills",
    status: "ready",
    lastIndexedAt: "2026-04-20T12:00:00.000Z",
  },
  {
    id: "generic::/users/lick/custom",
    name: "Custom Library",
    toolKind: "generic",
    sourceType: "custom",
    rootPath: "/Users/lick/custom",
    status: "warning",
    lastIndexedAt: "2026-04-19T12:00:00.000Z",
  },
];

const skills: SkillSummary[] = [
  {
    id: "1",
    name: "Frontend Skill",
    toolKind: "codex",
    sourceId: sources[0].id,
    sourcePath: sources[0].rootPath,
    skillPath: "/Users/lick/.codex/skills/frontend-skill",
    skillFilePath: "/Users/lick/.codex/skills/frontend-skill/SKILL.md",
    detectedFormat: "skill-md",
    compatibility: "codex",
    status: "valid",
    issues: [],
    preview: "Build modern interfaces.",
    updatedAt: "2026-04-20T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Claude Translator",
    toolKind: "generic",
    sourceId: sources[1].id,
    sourcePath: sources[1].rootPath,
    skillPath: "/Users/lick/custom/claude-translator",
    skillFilePath: "/Users/lick/custom/claude-translator/SKILL.md",
    detectedFormat: "skill-md",
    compatibility: "claude",
    status: "warning",
    issues: [
      {
        code: "missing-title",
        message: "No title heading found.",
        severity: "warning",
      },
    ],
    preview: "Translate prompts and instructions.",
    updatedAt: "2026-04-20T12:00:00.000Z",
  },
];

describe("skills index helpers", () => {
  test("filters by tool kind and validation status", () => {
    const result = filterSkills(skills, {
      search: "",
      toolKind: "generic",
      status: "warning",
      sourceId: "all",
    });

    expect(result).toEqual([skills[1]]);
  });

  test("matches search against name and preview", () => {
    const result = filterSkills(skills, {
      search: "modern",
      toolKind: "all",
      status: "all",
      sourceId: "all",
    });

    expect(result).toEqual([skills[0]]);
  });

  test("sorts by update time descending by default", () => {
    expect(sortSkills(skills, "updated-desc")).toEqual([skills[1], skills[0]]);
  });

  test("groups built-in and custom sources for the sidebar", () => {
    expect(groupSources(sources)).toEqual({
      builtin: [sources[0]],
      custom: [sources[1]],
    });
  });
});
