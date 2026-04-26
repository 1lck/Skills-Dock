import { describe, expect, test } from "vitest";

import type { SkillDetail, SourceRecord } from "../models/skill";
import type { CustomBundleDefinition } from "../storage/custom-sources";
import { aggregateInstalledSkills } from "./skills-catalog";
import { aggregateSkillBundles } from "./skill-bundles";

const now = "2026-04-20T12:00:00.000Z";

const sources: SourceRecord[] = [
  {
    id: "codex::/Users/lick/.codex/superpowers/skills",
    name: "Codex Superpowers",
    toolKind: "codex",
    sourceType: "builtin",
    rootPath: "/Users/lick/.codex/superpowers/skills",
    status: "ready",
    lastIndexedAt: now,
  },
  {
    id: "codex::/Users/lick/.codex/skills",
    name: "Codex Skills",
    toolKind: "codex",
    sourceType: "builtin",
    rootPath: "/Users/lick/.codex/skills",
    status: "ready",
    lastIndexedAt: now,
  },
];

const baseSkill = {
  detectedFormat: "skill-md",
  issues: [],
  pathKind: "directory" as const,
  updatedAt: now,
  relatedFiles: [],
  compatibility: "codex" as const,
  status: "valid" as const,
} satisfies Partial<SkillDetail>;

describe("skill bundle aggregation", () => {
  test("groups known workflow pack roots into one bundle", () => {
    const skills = aggregateInstalledSkills([
      {
        ...baseSkill,
        id: "brainstorming",
        name: "brainstorming",
        toolKind: "codex",
        sourceId: sources[0].id,
        sourcePath: sources[0].rootPath,
        skillPath: "/Users/lick/.codex/superpowers/skills/brainstorming",
        skillFilePath: "/Users/lick/.codex/superpowers/skills/brainstorming/SKILL.md",
        preview: "Explore user intent before implementation.",
        content: "# brainstorming",
        contentHash: "brainstorming-hash",
      },
      {
        ...baseSkill,
        id: "writing-plans",
        name: "writing-plans",
        toolKind: "codex",
        sourceId: sources[0].id,
        sourcePath: sources[0].rootPath,
        skillPath: "/Users/lick/.codex/superpowers/skills/writing-plans",
        skillFilePath: "/Users/lick/.codex/superpowers/skills/writing-plans/SKILL.md",
        preview: "Turn approved specs into executable plans.",
        content: "# writing-plans",
        contentHash: "writing-plans-hash",
      },
    ]);

    const bundles = aggregateSkillBundles(skills, sources);

    expect(bundles).toHaveLength(1);
    expect(bundles[0].name).toBe("superpowers");
    expect(bundles[0].memberCount).toBe(2);
    expect(bundles[0].groupingKind).toBe("source-parent");
    expect(bundles[0].members.map((member) => member.name)).toEqual([
      "brainstorming",
      "writing-plans",
    ]);
  });

  test("keeps standalone installed skills as single-skill bundles", () => {
    const skills = aggregateInstalledSkills([
      {
        ...baseSkill,
        id: "frontend-skill",
        name: "Frontend Skill",
        toolKind: "codex",
        sourceId: sources[1].id,
        sourcePath: sources[1].rootPath,
        skillPath: "/Users/lick/.codex/skills/frontend-skill",
        skillFilePath: "/Users/lick/.codex/skills/frontend-skill/SKILL.md",
        preview: "Build modern interfaces.",
        content: "# Frontend Skill",
        contentHash: "frontend-hash",
      },
    ]);

    const bundles = aggregateSkillBundles(skills, sources);

    expect(bundles).toHaveLength(1);
    expect(bundles[0].name).toBe("Frontend Skill");
    expect(bundles[0].memberCount).toBe(1);
    expect(bundles[0].groupingKind).toBe("single-skill");
    expect(bundles[0].primarySkill?.canonicalId).toBe("frontend-skill");
  });

  test("overlays persisted custom bundles on top of source-derived bundles", () => {
    const skills = aggregateInstalledSkills([
      {
        ...baseSkill,
        id: "frontend-skill",
        name: "Frontend Skill",
        toolKind: "codex",
        sourceId: sources[1].id,
        sourcePath: sources[1].rootPath,
        skillPath: "/Users/lick/.codex/skills/frontend-skill",
        skillFilePath: "/Users/lick/.codex/skills/frontend-skill/SKILL.md",
        preview: "Build modern interfaces.",
        content: "# Frontend Skill",
        contentHash: "frontend-hash",
      },
      {
        ...baseSkill,
        id: "documentation-lookup",
        name: "documentation-lookup",
        toolKind: "generic",
        sourceId: "generic::/Users/lick/custom",
        sourcePath: "/Users/lick/custom",
        skillPath: "/Users/lick/custom/documentation-lookup",
        skillFilePath:
          "/Users/lick/custom/documentation-lookup/SKILL.md",
        preview: "Fetch current library documentation.",
        content: "# documentation-lookup",
        contentHash: "docs-hash",
      },
    ]);
    const customBundles: CustomBundleDefinition[] = [
      {
        id: "custom::my-bundle-1",
        name: "My Bundle 1",
        memberSkillIds: ["frontend-skill", "documentation-lookup"],
        desiredApps: {
          claude: false,
          codex: true,
          gemini: false,
          opencode: false,
        },
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: null,
        lastRepairedAt: null,
      },
    ];

    const bundles = aggregateSkillBundles(skills, sources, {}, customBundles);

    expect(bundles[0].groupingKind).toBe("custom");
    expect(bundles[0].name).toBe("My Bundle 1");
    expect(bundles[0].memberCount).toBe(2);
    expect(bundles[0].originType).toBe("custom");
    expect(bundles[0].syncStatus).toBe("pending");
    expect(bundles[0].members.map((member) => member.canonicalId)).toEqual([
      "documentation-lookup",
      "frontend-skill",
    ]);
  });

  test("marks custom bundle as drifted when a desired app no longer contains all members", () => {
    const skills = aggregateInstalledSkills([
      {
        ...baseSkill,
        id: "frontend-skill",
        name: "Frontend Skill",
        toolKind: "codex",
        sourceId: sources[1].id,
        sourcePath: sources[1].rootPath,
        skillPath: "/Users/lick/.codex/skills/frontend-skill",
        skillFilePath: "/Users/lick/.codex/skills/frontend-skill/SKILL.md",
        preview: "Build modern interfaces.",
        content: "# Frontend Skill",
        contentHash: "frontend-hash",
      },
      {
        ...baseSkill,
        id: "documentation-lookup",
        name: "documentation-lookup",
        toolKind: "generic",
        sourceId: "generic::/Users/lick/custom",
        sourcePath: "/Users/lick/custom",
        skillPath: "/Users/lick/custom/documentation-lookup",
        skillFilePath: "/Users/lick/custom/documentation-lookup/SKILL.md",
        preview: "Fetch current library documentation.",
        content: "# documentation-lookup",
        contentHash: "docs-hash",
      },
    ]);
    const customBundles: CustomBundleDefinition[] = [
      {
        id: "custom::my-bundle-1",
        name: "My Bundle 1",
        memberSkillIds: ["frontend-skill", "documentation-lookup", "missing-skill"],
        desiredApps: {
          claude: false,
          codex: true,
          gemini: false,
          opencode: false,
        },
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: now,
        lastRepairedAt: null,
      },
    ];

    const bundles = aggregateSkillBundles(skills, sources, {}, customBundles);

    expect(bundles[0].syncStatus).toBe("drifted");
    expect(bundles[0].missingMemberSkillIds).toEqual(["missing-skill"]);
  });
});
