import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { aggregateInstalledSkills } from "../../lib/application/skills-catalog";
import type { SkillDetail, SourceRecord } from "../../lib/models/skill";
import { AppShell } from "./app-shell";

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

const rawSkills: SkillDetail[] = [
  {
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
    issues: [],
    preview: "Build modern interfaces.",
    updatedAt: "2026-04-20T12:00:00.000Z",
    content: "# Frontend Skill\n\nBuild modern interfaces.",
    contentHash: "hash-frontend",
    pathKind: "directory",
    relatedFiles: [],
  },
];

const skills = aggregateInstalledSkills(rawSkills);
const appCounts = {
  claude: 0,
  codex: 1,
  gemini: 0,
  opencode: 0,
};
const installedApps = {
  claude: true,
  codex: true,
  gemini: true,
  opencode: true,
};

describe("AppShell", () => {
  test("renders skills region and no detail when no skill selected", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={null}
        search=""
        selectedInstallationState="all"
        selectedToolKind="all"
        selectedSourceId="all"
        selectedSkillIds={[]}
        batchBusy={false}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectInstallationState={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
        usageMap={{}}
        installedApps={installedApps}
      />,
    );

    expect(screen.getByRole("button", { name: "Frontend Skill" })).toBeVisible();
    // Detail panel is now a modal — it should not exist when no skill is selected
    expect(screen.queryByRole("region", { name: "Skill Detail" })).toBeNull();
  });

  test("applies selected filters to the visible list", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedInstallationState="all"
        selectedToolKind="all"
        selectedSourceId="all"
        selectedSkillIds={[]}
        batchBusy={false}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectInstallationState={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
        usageMap={{}}
        installedApps={installedApps}
      />,
    );

    fireEvent.change(screen.getByLabelText("Search skills"), {
      target: { value: "frontend" },
    });

    expect(screen.getByRole("button", { name: "Frontend Skill" })).toBeVisible();
    expect(screen.getAllByText("Build modern interfaces.").length).toBeGreaterThan(0);
  });

  test("shows an empty detail state when no skill is selected", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={null}
        search=""
        selectedInstallationState="all"
        selectedToolKind="all"
        selectedSourceId="all"
        selectedSkillIds={[]}
        batchBusy={false}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectInstallationState={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
        usageMap={{}}
        installedApps={installedApps}
      />,
    );

    // Detail is now a modal — no modal rendered means no empty state text visible
    expect(screen.queryByText("Select a skill to inspect its files and validation status.")).toBeNull();
  });

  test("shows a demo mode banner when previewing mock data", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedInstallationState="all"
        selectedToolKind="all"
        selectedSourceId="all"
        selectedSkillIds={[]}
        batchBusy={false}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectInstallationState={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
        usageMap={{}}
        installedApps={installedApps}
      />,
    );

    expect(
      screen.getByText(/演示模式/),
    ).toBeVisible();
  });

  test("toggles app install state from the skill row", () => {
    const onToggleApp = vi.fn();

    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedInstallationState="all"
        selectedToolKind="all"
        selectedSourceId="all"
        selectedSkillIds={[]}
        batchBusy={false}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectInstallationState={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={onToggleApp}
        usageMap={{}}
        installedApps={installedApps}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "切换 Claude 安装状态" }));

    expect(onToggleApp).toHaveBeenCalledWith("frontend-skill", "claude", true);
  });

  test("filters skills when clicking a top app summary chip", () => {
    const onSelectToolKind = vi.fn();

    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedInstallationState="all"
        selectedToolKind="all"
        selectedSourceId="all"
        selectedSkillIds={[]}
        batchBusy={false}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectInstallationState={vi.fn()}
        onSelectToolKind={onSelectToolKind}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
        usageMap={{}}
        installedApps={installedApps}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "按 Claude 筛选" }));

    expect(onSelectToolKind).toHaveBeenCalledWith("claude");
  });

  test("keeps top app counts independent from the filtered list count", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={{ claude: 11, codex: 26, gemini: 0, opencode: 0 }}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedInstallationState="all"
        selectedToolKind="codex"
        selectedSourceId="all"
        selectedSkillIds={[]}
        batchBusy={false}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectInstallationState={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
        usageMap={{}}
        installedApps={installedApps}
      />,
    );

    expect(screen.getByRole("button", { name: "按 Codex 筛选" })).toHaveTextContent(
      "Codex: 26",
    );
    expect(screen.getByText("1")).toBeVisible();
  });

  test("opens top filters and forwards installation state selection", () => {
    const onSelectInstallationState = vi.fn();

    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedInstallationState="all"
        selectedToolKind="all"
        selectedSourceId="all"
        selectedSkillIds={[]}
        batchBusy={false}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectInstallationState={onSelectInstallationState}
        onSelectToolKind={vi.fn()}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
        usageMap={{}}
        installedApps={installedApps}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开筛选" }));
    fireEvent.change(screen.getByLabelText("安装状态筛选"), {
      target: { value: "conflict" },
    });

    expect(onSelectInstallationState).toHaveBeenCalledWith("conflict");
  });
});
