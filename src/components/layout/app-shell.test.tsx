import type { ComponentProps } from "react";
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

function renderShell(overrides: Partial<ComponentProps<typeof AppShell>> = {}) {
  const props: ComponentProps<typeof AppShell> = {
    loading: false,
    isDemoMode: false,
    sources,
    appCounts,
    skills,
    selectedSkill: null,
    selectedSkillIds: [],
    exportSelectionCount: 0,
    search: "",
    selectedSourceId: "all",
    selectedInstallationState: "all",
    selectedToolKind: "all",
    batchBusy: false,
    usageMap: {},
    installedApps,
    onSearchChange: vi.fn(),
    onRefresh: vi.fn(),
    onAddFolder: vi.fn(),
    onImportZip: vi.fn(),
    onExportSelected: vi.fn(),
    onSelectInstallationState: vi.fn(),
    onSelectToolKind: vi.fn(),
    onSelectSource: vi.fn(),
    onSelectSkill: vi.fn(),
    onToggleSkillSelection: vi.fn(),
    onToggleSelectAllVisible: vi.fn(),
    onClearSelection: vi.fn(),
    onBatchApply: vi.fn(),
    onOpenPath: vi.fn(),
    onToggleApp: vi.fn(),
    ...overrides,
  };

  return render(<AppShell {...props} />);
}

describe("AppShell", () => {
  test("renders skills region and no detail when no skill selected", () => {
    renderShell();

    expect(screen.getByRole("button", { name: "Frontend Skill" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Skill Detail" })).toBeNull();
  });

  test("applies selected filters to the visible list", () => {
    renderShell({ selectedSkill: skills[0] });

    fireEvent.change(screen.getByLabelText("Search skills"), {
      target: { value: "frontend" },
    });

    expect(screen.getByRole("button", { name: "Frontend Skill" })).toBeVisible();
    expect(screen.getAllByText("Build modern interfaces.").length).toBeGreaterThan(0);
  });

  test("shows an empty detail state when no skill is selected", () => {
    renderShell();

    expect(
      screen.queryByText("Select a skill to inspect its files and validation status."),
    ).toBeNull();
  });

  test("shows a demo mode banner when previewing mock data", () => {
    renderShell({ isDemoMode: true, selectedSkill: skills[0] });

    expect(screen.getByText(/演示模式/)).toBeVisible();
  });

  test("toggles app install state from the skill row", () => {
    const onToggleApp = vi.fn();

    renderShell({ onToggleApp, selectedSkill: skills[0] });

    fireEvent.click(screen.getByRole("button", { name: "切换 Claude 安装状态" }));

    expect(onToggleApp).toHaveBeenCalledWith("frontend-skill", "claude", true);
  });

  test("filters skills when clicking a top app summary chip", () => {
    const onSelectToolKind = vi.fn();

    renderShell({ onSelectToolKind, selectedSkill: skills[0] });

    fireEvent.click(screen.getByRole("button", { name: "按 Claude 筛选" }));

    expect(onSelectToolKind).toHaveBeenCalledWith("claude");
  });

  test("keeps top app counts independent from the filtered list count", () => {
    renderShell({
      appCounts: { claude: 11, codex: 26, gemini: 0, opencode: 0 },
      selectedSkill: skills[0],
      selectedToolKind: "codex",
    });

    expect(screen.getByRole("button", { name: "按 Codex 筛选" })).toHaveTextContent(
      "Codex: 26",
    );
    expect(screen.getByText("1")).toBeVisible();
  });

  test("disables top app chips for apps that are not installed locally", () => {
    const onSelectToolKind = vi.fn();

    renderShell({
      onSelectToolKind,
      selectedSkill: skills[0],
      installedApps: { ...installedApps, gemini: false, opencode: false },
    });

    const geminiChip = screen.getByRole("button", { name: "按 Gemini 筛选" });
    const opencodeChip = screen.getByRole("button", { name: "按 OpenCode 筛选" });

    expect(geminiChip).toBeDisabled();
    expect(opencodeChip).toBeDisabled();
    expect(screen.getByText("未安装 Gemini，无法筛选")).toBeInTheDocument();
    expect(screen.getByText("未安装 OpenCode，无法筛选")).toBeInTheDocument();

    fireEvent.click(geminiChip);
    fireEvent.click(opencodeChip);

    expect(onSelectToolKind).not.toHaveBeenCalled();
  });

  test("opens top filters and forwards installation state selection", () => {
    const onSelectInstallationState = vi.fn();

    renderShell({ onSelectInstallationState, selectedSkill: skills[0] });

    fireEvent.click(screen.getByRole("button", { name: "打开筛选" }));
    fireEvent.change(screen.getByLabelText("安装状态筛选"), {
      target: { value: "conflict" },
    });

    expect(onSelectInstallationState).toHaveBeenCalledWith("conflict");
  });

  test("disables export button until at least one skill is selected", () => {
    const onExportSelected = vi.fn();
    const { rerender } = renderShell({ onExportSelected });

    expect(screen.getByRole("button", { name: "导出所选" })).toBeDisabled();

    rerender(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        selectedSkillIds={[skills[0].id]}
        exportSelectionCount={1}
        search=""
        selectedSourceId="all"
        selectedInstallationState="all"
        selectedToolKind="all"
        batchBusy={false}
        usageMap={{}}
        installedApps={installedApps}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onImportZip={vi.fn()}
        onExportSelected={onExportSelected}
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
      />,
    );

    const exportButton = screen.getByRole("button", { name: "导出所选 (1)" });
    expect(exportButton).toBeEnabled();

    fireEvent.click(exportButton);
    expect(onExportSelected).toHaveBeenCalled();
  });

  test("shows discover button as disabled with a pending hint", () => {
    renderShell();

    const discoverButton = screen.getByRole("button", { name: "发现技能" });
    expect(discoverButton).toBeDisabled();
    expect(screen.getByText("发现技能功能待开发")).toBeInTheDocument();
  });
});
