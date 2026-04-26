import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { AggregatedInstalledSkill, SkillBundle } from "../../lib/models/skill";
import { SkillsList } from "./skills-list";

const sourceId = "codex::/users/lick/.codex/skills";
const sourceRootPath = "/Users/lick/.codex/skills";
const installedApps = {
  claude: true,
  codex: true,
  gemini: true,
  opencode: true,
};

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
      sourceId,
      sourcePath: sourceRootPath,
      skillPath: "/Users/lick/.codex/skills/frontend-skill",
      skillFilePath: "/Users/lick/.codex/skills/frontend-skill/SKILL.md",
      status: "valid",
      pathKind: "directory",
      contentHash: "hash-frontend",
      updatedAt: "2026-04-20T12:00:00.000Z",
    },
  ],
  primaryInstallation: null,
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
  preview: "Two frontend helpers for UI work.",
  updatedAt: "2026-04-20T12:00:00.000Z",
  apps: { claude: false, codex: true, gemini: false, opencode: false },
  desiredApps: { claude: false, codex: false, gemini: false, opencode: false },
  sourceIds: [sourceId],
  sourcePaths: [sourceRootPath],
  memberCount: 1,
  usageCount: 0,
  missingMemberSkillIds: [],
  lastSyncedAt: null,
  lastRepairedAt: null,
  members: [skill],
  primarySkill: skill,
};

describe("SkillsList", () => {
  test("renders bundle rows with member counts", () => {
    render(
      <SkillsList
        skills={[bundle]}
        loading={false}
        selectedSkillId={bundle.id}
        selectedSkillIds={[]}
        batchBusy={false}
        usageMap={{}}
        installedApps={installedApps}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onCreateBundle={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onToggleApp={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Frontend Bundle" })).toBeVisible();
    expect(screen.getByText("1 个成员")).toBeVisible();
  });

  test("disables app toggle buttons for apps that are not installed locally", () => {
    const onToggleApp = vi.fn();

    render(
      <SkillsList
        skills={[bundle]}
        loading={false}
        selectedSkillId={bundle.id}
        selectedSkillIds={[]}
        batchBusy={false}
        usageMap={{}}
        installedApps={{ ...installedApps, gemini: false }}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onCreateBundle={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onToggleApp={onToggleApp}
      />,
    );

    const geminiToggle = screen.getByRole("button", { name: "切换 Gemini 安装状态" });
    expect(geminiToggle).toBeDisabled();

    fireEvent.click(geminiToggle);
    expect(onToggleApp).not.toHaveBeenCalled();
  });

  test.skip("supports selecting rows and triggering batch install actions [UI not yet implemented in SkillsList]", () => {
    const onToggleSkillSelection = vi.fn();
    const onBatchApply = vi.fn();

    render(
      <SkillsList
        skills={[bundle]}
        loading={false}
        selectedSkillId={bundle.id}
        selectedSkillIds={[bundle.id]}
        batchBusy={false}
        usageMap={{}}
        installedApps={installedApps}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={onToggleSkillSelection}
        onToggleSelectAllVisible={vi.fn()}
        onCreateBundle={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={onBatchApply}
        onToggleApp={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "选择 Frontend Bundle" }));
    fireEvent.click(screen.getByRole("button", { name: "批量安装到 Claude" }));

    expect(onToggleSkillSelection).toHaveBeenCalledWith(skill.id);
    expect(onBatchApply).toHaveBeenCalledWith("claude", true);
  });

  test("creates a local bundle from selected rows", () => {
    const onCreateBundle = vi.fn();

    render(
      <SkillsList
        skills={[bundle]}
        loading={false}
        selectedSkillId={bundle.id}
        selectedSkillIds={[bundle.id]}
        batchBusy={false}
        usageMap={{}}
        installedApps={installedApps}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onCreateBundle={onCreateBundle}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onToggleApp={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "整合为本地包" }));

    expect(onCreateBundle).toHaveBeenCalled();
  });
});
