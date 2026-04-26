import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { AggregatedInstalledSkill, SkillBundle, SourceRecord } from "../../lib/models/skill";
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

const bundle: SkillBundle = {
  id: "frontend-bundle",
  canonicalId: "frontend-bundle",
  name: "Frontend Bundle",
  groupingKind: "source-root",
  originType: "source",
  syncStatus: "unmanaged",
  status: "valid",
  installationState: "ready",
  preview: "Build modern interfaces.",
  updatedAt: "2026-04-20T12:00:00.000Z",
  apps: { claude: false, codex: true, gemini: false, opencode: false },
  desiredApps: { claude: false, codex: false, gemini: false, opencode: false },
  sourceIds: [sources[0].id],
  sourcePaths: [sources[0].rootPath],
  memberCount: 1,
  usageCount: 0,
  missingMemberSkillIds: [],
  lastSyncedAt: null,
  lastRepairedAt: null,
  members: [skill],
  primarySkill: skill,
};

const customBundle: SkillBundle = {
  ...bundle,
  id: "custom::frontend-bundle",
  canonicalId: "custom::frontend-bundle",
  originType: "custom",
  groupingKind: "custom",
  syncStatus: "pending",
  desiredApps: { claude: false, codex: true, gemini: false, opencode: false },
};

describe("SkillDetailPanel", () => {
  test("shows bundle metadata and member skills", () => {
    render(
      <SkillDetailPanel
        skill={bundle}
        onOpenPath={vi.fn()}
      />,
    );

    expect(screen.getByText("Bundle 概览")).toBeVisible();
    expect(screen.getByText(/原始技能文档默认隐藏/)).toBeVisible();
    expect(screen.getByRole("button", { name: /在编辑器中打开原始 SKILL\.md/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: "安装到应用" })).toBeNull();
    expect(screen.queryByText("SKILL.md 预览")).toBeNull();
    expect(screen.getAllByText("Frontend Skill").length).toBeGreaterThan(0);
  });

  test("supports local bundle management actions", () => {
    const onRenameBundle = vi.fn();
    const onDeleteBundle = vi.fn();
    const onToggleBundleMember = vi.fn();
    const onSetBundleDesiredApp = vi.fn();
    const onSyncBundle = vi.fn();
    const onRepairBundle = vi.fn();

    render(
      <SkillDetailPanel
        skill={customBundle}
        availableSkills={[skill]}
        onOpenPath={vi.fn()}
        onRenameBundle={onRenameBundle}
        onDeleteBundle={onDeleteBundle}
        onToggleBundleMember={onToggleBundleMember}
        onSetBundleDesiredApp={onSetBundleDesiredApp}
        onSyncBundle={onSyncBundle}
        onRepairBundle={onRepairBundle}
      />,
    );

    fireEvent.change(screen.getByLabelText("Bundle 名称"), {
      target: { value: "My Local Bundle" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存名称" }));
    fireEvent.click(screen.getByRole("button", { name: "同步本地包" }));
    fireEvent.click(screen.getByRole("button", { name: "修复目标应用" }));
    fireEvent.click(screen.getByRole("button", { name: "删除本地包" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Codex/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Frontend Skill/ }));

    expect(onRenameBundle).toHaveBeenCalledWith(customBundle.id, "My Local Bundle");
    expect(onSyncBundle).toHaveBeenCalledWith(customBundle.id);
    expect(onRepairBundle).toHaveBeenCalledWith(customBundle.id);
    expect(onDeleteBundle).toHaveBeenCalledWith(customBundle.id);
    expect(onSetBundleDesiredApp).toHaveBeenCalledWith(customBundle.id, "codex", false);
    expect(onToggleBundleMember).toHaveBeenCalledWith(customBundle.id, skill.canonicalId);
  });

  test("shows provider buttons when chinese summary is idle", () => {
    const onGenerateAiSummaryWithProvider = vi.fn();
    render(
      <SkillDetailPanel
        skill={bundle}
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
        skill={bundle}
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
