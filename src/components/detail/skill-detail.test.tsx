import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { AggregatedInstalledSkill, SourceRecord } from "../../lib/models/skill";
import { SkillDetailPanel } from "./skill-detail";

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
];

const skill: AggregatedInstalledSkill = {
  id: "frontend-skill",
  canonicalId: "frontend-skill",
  name: "Frontend Skill",
  status: "valid",
  installationState: "ready",
  preview: "Build modern interfaces.",
  updatedAt: "2026-04-20T12:00:00.000Z",
  apps: { claude: false, codex: true, gemini: false, opencode: false },
  installations: [
    {
      id: "frontend",
      toolKind: "codex",
      sourceId: sources[0].id,
      sourcePath: sources[0].rootPath,
      skillPath: "/Users/lick/.codex/skills/frontend-skill",
      skillFilePath: "/Users/lick/.codex/skills/frontend-skill/SKILL.md",
      status: "valid",
      pathKind: "directory",
      contentHash: "hash-frontend",
      updatedAt: "2026-04-20T12:00:00.000Z",
    },
  ],
  primaryInstallation: {
    id: "frontend",
    name: "Frontend Skill",
    toolKind: "codex",
    sourceId: sources[0].id,
    sourcePath: sources[0].rootPath,
    skillPath: "/Users/lick/.codex/skills/frontend-skill",
    skillFilePath: "/Users/lick/.codex/skills/frontend-skill/SKILL.md",
    detectedFormat: "skill-md",
    compatibility: "codex",
    status: "valid",
    pathKind: "directory",
    issues: [],
    preview: "Build modern interfaces.",
    updatedAt: "2026-04-20T12:00:00.000Z",
    content: "# Frontend Skill\n\nBuild modern interfaces.",
    contentHash: "hash-frontend",
    relatedFiles: [],
  },
};

describe("SkillDetailPanel", () => {
  test("shows provider buttons when chinese summary is idle", () => {
    const onGenerateAiSummaryWithProvider = vi.fn();
    render(
      <SkillDetailPanel
        skill={skill}
        onOpenPath={vi.fn()}
        onGenerateAiSummary={vi.fn()}
        onGenerateAiSummaryWithProvider={onGenerateAiSummaryWithProvider}
        selectedAiProvider="claude"
        aiSummary={{
          status: "idle",
          availableProviders: ["codex", "claude"],
          provider: null,
          result: null,
          error: null,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Claude" }));

    expect(onGenerateAiSummaryWithProvider).toHaveBeenCalledWith("claude");
    expect(screen.getByRole("button", { name: "Codex" })).toBeVisible();
    expect(screen.getByText("点选你要使用的本机 CLI")).toBeVisible();
  });

  test("renders translated markdown when chinese summary is ready", () => {
    render(
      <SkillDetailPanel
        skill={skill}
        onOpenPath={vi.fn()}
        onGenerateAiSummary={vi.fn()}
        aiSummary={{
          status: "complete",
          availableProviders: ["codex"],
          provider: "codex",
          error: null,
          result: {
            titleZh: "前端技能",
            summaryZh: "构建现代界面。",
            translatedMarkdownZh: "# 前端技能\n\n构建现代界面。",
            generatedAt: "2026-04-21T10:00:00.000Z",
            provider: "codex",
          },
        }}
      />,
    );

    expect(screen.getByText("AI 中文解读")).toBeVisible();
    expect(screen.getAllByText("前端技能").length).toBeGreaterThan(0);
    expect(screen.getAllByText("构建现代界面。").length).toBeGreaterThan(0);
  });
});
