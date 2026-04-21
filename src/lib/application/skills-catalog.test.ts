import { describe, expect, test } from "vitest";

import type { SkillDetail } from "../models/skill";
import { aggregateInstalledSkills, countInstalledApps, sortInstalledSkills } from "./skills-catalog";

const now = "2026-04-20T12:00:00.000Z";

const baseSkill = {
  detectedFormat: "skill-md",
  contentHash: "hash-base",
  issues: [],
  pathKind: "directory" as const,
  updatedAt: now,
  relatedFiles: [],
  compatibility: "unknown" as const,
} satisfies Partial<SkillDetail>;

describe("skills catalog aggregation", () => {
  test("aggregates one skill across multiple app directories into a single row", () => {
    const skills: SkillDetail[] = [
      {
        ...baseSkill,
        id: "codex::error-resolver",
        name: "Error Resolver",
        toolKind: "codex",
        sourceId: "codex::/Users/lick/.codex/skills",
        sourcePath: "/Users/lick/.codex/skills",
        skillPath: "/Users/lick/.codex/skills/error-resolver",
        skillFilePath: "/Users/lick/.codex/skills/error-resolver/SKILL.md",
        status: "valid",
        preview: "Systematic error diagnosis.",
        content: "# Error Resolver",
        contentHash: "hash-a",
      },
      {
        ...baseSkill,
        id: "claude::error-resolver",
        name: "Error Resolver",
        toolKind: "claude",
        sourceId: "claude::/Users/lick/.claude/skills",
        sourcePath: "/Users/lick/.claude/skills",
        skillPath: "/Users/lick/.claude/skills/error-resolver",
        skillFilePath: "/Users/lick/.claude/skills/error-resolver/SKILL.md",
        status: "warning",
        preview: "Systematic error diagnosis.",
        content: "# Error Resolver",
        contentHash: "hash-b",
        issues: [
          {
            code: "missing-title",
            message: "No title heading found.",
            severity: "warning",
          },
        ],
      },
    ];

    const aggregated = aggregateInstalledSkills(skills);

    expect(aggregated).toHaveLength(1);
    expect(aggregated[0].apps).toEqual({
      claude: true,
      codex: true,
      gemini: false,
      opencode: false,
    });
    expect(aggregated[0].status).toBe("warning");
    expect(aggregated[0].installations).toHaveLength(2);
    expect(aggregated[0].installations[0].contentHash).toBe("hash-a");
    expect(aggregated[0].installations[1].contentHash).toBe("hash-b");
  });

  test("keeps custom folder skills available without marking them as installed apps", () => {
    const aggregated = aggregateInstalledSkills([
      {
        ...baseSkill,
        id: "generic::frontend-skill",
        name: "Frontend Skill",
        toolKind: "generic",
        sourceId: "generic::/Users/lick/custom",
        sourcePath: "/Users/lick/custom",
        skillPath: "/Users/lick/custom/frontend-skill",
        skillFilePath: "/Users/lick/custom/frontend-skill/SKILL.md",
        status: "valid",
        preview: "Build modern interfaces.",
        content: "# Frontend Skill",
        contentHash: "hash-c",
      },
    ]);

    expect(aggregated[0].apps).toEqual({
      claude: false,
      codex: false,
      gemini: false,
      opencode: false,
    });
    expect(aggregated[0].installationState).toBe("external");
    expect(aggregated[0].installations[0].toolKind).toBe("generic");
  });

  test("marks a skill as conflict when installed app copies diverge", () => {
    const aggregated = aggregateInstalledSkills([
      {
        ...baseSkill,
        id: "codex::error-resolver",
        name: "Error Resolver",
        toolKind: "codex",
        sourceId: "codex::/Users/lick/.codex/skills",
        sourcePath: "/Users/lick/.codex/skills",
        skillPath: "/Users/lick/.codex/skills/error-resolver",
        skillFilePath: "/Users/lick/.codex/skills/error-resolver/SKILL.md",
        status: "valid",
        preview: "Systematic error diagnosis.",
        content: "# Error Resolver",
        contentHash: "hash-a",
      },
      {
        ...baseSkill,
        id: "claude::error-resolver",
        name: "Error Resolver",
        toolKind: "claude",
        sourceId: "claude::/Users/lick/.claude/skills",
        sourcePath: "/Users/lick/.claude/skills",
        skillPath: "/Users/lick/.claude/skills/error-resolver",
        skillFilePath: "/Users/lick/.claude/skills/error-resolver/SKILL.md",
        status: "valid",
        preview: "Systematic error diagnosis.",
        content: "# Error Resolver",
        contentHash: "hash-b",
      },
    ]);

    expect(aggregated[0].installationState).toBe("conflict");
  });

  test("marks a skill as linked when an installed app folder is a symlink", () => {
    const aggregated = aggregateInstalledSkills([
      {
        ...baseSkill,
        id: "claude::error-resolver",
        name: "Error Resolver",
        toolKind: "claude",
        sourceId: "claude::/Users/lick/.claude/skills",
        sourcePath: "/Users/lick/.claude/skills",
        skillPath: "/Users/lick/.claude/skills/error-resolver",
        skillFilePath: "/Users/lick/.claude/skills/error-resolver/SKILL.md",
        status: "valid",
        preview: "Systematic error diagnosis.",
        content: "# Error Resolver",
        contentHash: "hash-a",
        pathKind: "symlink",
      },
    ]);

    expect(aggregated[0].installationState).toBe("linked");
  });

  test("marks a skill as attention when validation issues exist", () => {
    const aggregated = aggregateInstalledSkills([
      {
        ...baseSkill,
        id: "codex::translator",
        name: "Translator",
        toolKind: "codex",
        sourceId: "codex::/Users/lick/.codex/skills",
        sourcePath: "/Users/lick/.codex/skills",
        skillPath: "/Users/lick/.codex/skills/translator",
        skillFilePath: "/Users/lick/.codex/skills/translator/SKILL.md",
        status: "warning",
        preview: "Translate prompts.",
        content: "# Translator",
        contentHash: "hash-warning",
        issues: [
          {
            code: "missing-title",
            message: "No title heading found.",
            severity: "warning",
          },
        ],
      },
    ]);

    expect(aggregated[0].installationState).toBe("attention");
  });

  test("counts installed apps from aggregated rows", () => {
    const counts = countInstalledApps([
      {
        id: "1",
        canonicalId: "error-resolver",
        name: "Error Resolver",
        status: "valid",
        installationState: "ready",
        preview: "desc",
        updatedAt: now,
        apps: { claude: true, codex: true, gemini: false, opencode: false },
        installations: [],
        primaryInstallation: null,
      },
      {
        id: "2",
        canonicalId: "gemini-executor",
        name: "gemini-executor",
        status: "valid",
        installationState: "ready",
        preview: "desc",
        updatedAt: now,
        apps: { claude: false, codex: false, gemini: true, opencode: true },
        installations: [],
        primaryInstallation: null,
      },
    ]);

    expect(counts).toEqual({
      claude: 1,
      codex: 1,
      gemini: 1,
      opencode: 1,
    });
  });

  test("sorts skills by call count before updated time", () => {
    const sorted = sortInstalledSkills(
      [
        {
          id: "1",
          canonicalId: "translator",
          name: "Translator",
          status: "valid",
          installationState: "ready",
          preview: "desc",
          updatedAt: "2026-04-20T14:00:00.000Z",
          apps: { claude: true, codex: false, gemini: false, opencode: false },
          installations: [],
          primaryInstallation: null,
        },
        {
          id: "2",
          canonicalId: "reviewer",
          name: "Reviewer",
          status: "valid",
          installationState: "ready",
          preview: "desc",
          updatedAt: "2026-04-20T13:00:00.000Z",
          apps: { claude: false, codex: true, gemini: false, opencode: false },
          installations: [],
          primaryInstallation: null,
        },
        {
          id: "3",
          canonicalId: "planner",
          name: "Planner",
          status: "valid",
          installationState: "ready",
          preview: "desc",
          updatedAt: "2026-04-20T12:00:00.000Z",
          apps: { claude: false, codex: false, gemini: true, opencode: false },
          installations: [],
          primaryInstallation: null,
        },
      ],
      {
        reviewer: { callCount: 8, lastCalledAt: "2026-04-20T13:00:00.000Z" },
        planner: { callCount: 8, lastCalledAt: "2026-04-20T12:00:00.000Z" },
        translator: { callCount: 3, lastCalledAt: "2026-04-20T14:00:00.000Z" },
      },
    );

    expect(sorted.map((skill) => skill.canonicalId)).toEqual([
      "reviewer",
      "planner",
      "translator",
    ]);
  });
});
