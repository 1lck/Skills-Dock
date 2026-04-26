import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { aggregateInstalledSkills } from "../../lib/application/skills-catalog";
import { aggregateSkillBundles } from "../../lib/application/skill-bundles";
import type { SkillDetail, SourceRecord } from "../../lib/models/skill";
import { AppShell } from "./app-shell";

const sources: SourceRecord[] = [
  {
    id: "codex::/users/lick/.codex/superpowers/skills",
    name: "Codex Superpowers",
    toolKind: "codex",
    sourceType: "builtin",
    rootPath: "/Users/lick/.codex/superpowers/skills",
    status: "ready",
    lastIndexedAt: "2026-04-20T12:00:00.000Z",
  },
];

const rawSkills: SkillDetail[] = [
  {
    id: "brainstorming",
    name: "brainstorming",
    toolKind: "codex",
    sourceId: sources[0].id,
    sourcePath: sources[0].rootPath,
    skillPath: "/Users/lick/.codex/superpowers/skills/brainstorming",
    skillFilePath: "/Users/lick/.codex/superpowers/skills/brainstorming/SKILL.md",
    detectedFormat: "skill-md",
    compatibility: "codex",
    status: "valid",
    issues: [],
    preview: "Explore user intent before implementation.",
    updatedAt: "2026-04-20T12:00:00.000Z",
    content: "# brainstorming\n\nExplore user intent before implementation.",
    contentHash: "hash-brainstorming",
    pathKind: "directory",
    relatedFiles: [],
  },
  {
    id: "writing-plans",
    name: "writing-plans",
    toolKind: "codex",
    sourceId: sources[0].id,
    sourcePath: sources[0].rootPath,
    skillPath: "/Users/lick/.codex/superpowers/skills/writing-plans",
    skillFilePath: "/Users/lick/.codex/superpowers/skills/writing-plans/SKILL.md",
    detectedFormat: "skill-md",
    compatibility: "codex",
    status: "valid",
    issues: [],
    preview: "Turn approved specs into executable plans.",
    updatedAt: "2026-04-20T12:00:00.000Z",
    content: "# writing-plans\n\nTurn approved specs into executable plans.",
    contentHash: "hash-writing-plans",
    pathKind: "directory",
    relatedFiles: [],
  },
];

const skills = aggregateSkillBundles(aggregateInstalledSkills(rawSkills), sources);
const availableSkills = aggregateInstalledSkills(rawSkills);
const appCounts = {
  claude: 0,
  codex: 2,
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
    availableSkills,
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
    onRefreshUsage: vi.fn(),
    onAddFolder: vi.fn(),
    onImportZip: vi.fn(),
    onExportSelected: vi.fn(),
    onSelectInstallationState: vi.fn(),
    onSelectToolKind: vi.fn(),
    onSelectSource: vi.fn(),
    onSelectSkill: vi.fn(),
    onToggleSkillSelection: vi.fn(),
    onToggleSelectAllVisible: vi.fn(),
    onCreateBundle: vi.fn(),
    onClearSelection: vi.fn(),
    onBatchApply: vi.fn(),
    onOpenPath: vi.fn(),
    onBrowseSource: vi.fn(),
    onToggleApp: vi.fn(),
    onRenameBundle: vi.fn(),
    onDeleteBundle: vi.fn(),
    onToggleBundleMember: vi.fn(),
    onSetBundleDesiredApp: vi.fn(),
    onSyncBundle: vi.fn(),
    onRepairBundle: vi.fn(),
    ...overrides,
  };

  return render(<AppShell {...props} />);
}

describe("AppShell", () => {
  beforeEach(() => {
    window.location.hash = "#skills";
  });

  test("opens overview when no hash is present", () => {
    window.location.hash = "";
    renderShell();

    expect(screen.getByRole("heading", { name: "概览" })).toBeVisible();
    expect(screen.getByRole("button", { name: "概览" })).toHaveClass("is-active");
  });

  test("renders skills region and no detail when no skill selected", () => {
    renderShell();

    expect(screen.getByRole("button", { name: "superpowers" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Skill Detail" })).toBeNull();
  });

  test("applies selected filters to the visible list", () => {
    renderShell({ selectedSkill: skills[0] });

    fireEvent.change(screen.getByLabelText("Search skills"), {
      target: { value: "brainstorming" },
    });

    expect(screen.getByRole("button", { name: "superpowers" })).toBeVisible();
    expect(screen.getAllByText(/Explore user intent/).length).toBeGreaterThan(0);
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

    expect(onToggleApp).toHaveBeenCalledWith(
      "codex::/users/lick/.codex/superpowers/skills::bundle::superpowers",
      "claude",
      true,
    );
  });

  test("keeps top app counts in metric cards without rendering app filter chips", () => {
    renderShell({
      appCounts: { claude: 11, codex: 26, gemini: 0, opencode: 0 },
      selectedSkill: skills[0],
      selectedToolKind: "codex",
    });

    expect(screen.queryByRole("button", { name: "按 Codex 筛选" })).toBeNull();
    expect(screen.getByText("已安装到 Codex")).toBeVisible();
    expect(screen.getByText("26")).toBeVisible();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
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
        availableSkills={availableSkills}
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
        onRefreshUsage={vi.fn()}
        onAddFolder={vi.fn()}
        onImportZip={vi.fn()}
        onExportSelected={onExportSelected}
        onSelectInstallationState={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onCreateBundle={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onBrowseSource={vi.fn()}
        onToggleApp={vi.fn()}
        onRenameBundle={vi.fn()}
        onDeleteBundle={vi.fn()}
        onToggleBundleMember={vi.fn()}
        onSetBundleDesiredApp={vi.fn()}
        onSyncBundle={vi.fn()}
        onRepairBundle={vi.fn()}
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

  test("forwards settings browse actions for source rows", () => {
    const onBrowseSource = vi.fn();
    window.location.hash = "#settings";

    renderShell({ onBrowseSource });

    fireEvent.click(screen.getAllByRole("button", { name: "浏览 Codex Superpowers" })[0]);

    expect(onBrowseSource).toHaveBeenCalledWith(sources[0], false);
  });

  test("loads usage data only when usage view is active", () => {
    const onRefreshUsage = vi.fn();
    window.location.hash = "#usage";

    const { rerender } = renderShell({ onRefreshUsage });

    expect(onRefreshUsage).toHaveBeenCalled();

    rerender(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        availableSkills={availableSkills}
        selectedSkill={null}
        selectedSkillIds={[]}
        exportSelectionCount={0}
        search=""
        selectedSourceId="all"
        selectedInstallationState="all"
        selectedToolKind="all"
        batchBusy={false}
        usageMap={{}}
        installedApps={installedApps}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onRefreshUsage={onRefreshUsage}
        onAddFolder={vi.fn()}
        onImportZip={vi.fn()}
        onExportSelected={vi.fn()}
        onSelectInstallationState={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSource={vi.fn()}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onCreateBundle={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onOpenPath={vi.fn()}
        onBrowseSource={vi.fn()}
        onToggleApp={vi.fn()}
        onRenameBundle={vi.fn()}
        onDeleteBundle={vi.fn()}
        onToggleBundleMember={vi.fn()}
        onSetBundleDesiredApp={vi.fn()}
        onSyncBundle={vi.fn()}
        onRepairBundle={vi.fn()}
      />,
    );

    expect(onRefreshUsage).toHaveBeenCalledTimes(1);
  });

  test("shows market preview notice before marketplace is connected", () => {
    window.location.hash = "#market";
    renderShell();

    expect(screen.getByRole("note", { name: "市场状态说明" })).toBeVisible();
    expect(screen.getByText(/正式市场源、在线安装、更新同步与发布流程尚未接入/)).toBeVisible();
  });
});
