import { useState } from "react";
import type { AiSummaryProvider, AiSummaryState } from "../../lib/models/ai-summary";
import type {
  AggregatedInstalledSkill,
  AppKind,
  InstallationState,
  SourceRecord,
  ToolKind,
} from "../../lib/models/skill";
import type { SkillUsageMap } from "../../lib/storage/skill-usage";
import { DisabledHint } from "../common/disabled-hint";
import { SkillDetailPanel } from "../detail/skill-detail";
import { SkillsList } from "../skills/skills-list";

interface AppShellProps {
  loading: boolean;
  isDemoMode: boolean;
  sources: SourceRecord[];
  appCounts: Record<AppKind, number>;
  skills: AggregatedInstalledSkill[];
  selectedSkill: AggregatedInstalledSkill | null;
  selectedSkillIds: string[];
  search: string;
  selectedSourceId: string | "all";
  selectedInstallationState: InstallationState | "all";
  selectedToolKind: ToolKind | "all";
  batchBusy: boolean;
  usageMap: SkillUsageMap;
  installedApps: Record<string, boolean>;
  aiSummary?: AiSummaryState | null;
  selectedAiProvider?: AiSummaryProvider | null;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onAddFolder: () => void;
  onImportZip: () => void;
  onExportSelected: () => void;
  onSelectInstallationState: (status: InstallationState | "all") => void;
  onSelectToolKind: (toolKind: ToolKind | "all") => void;
  onSelectSource: (sourceId: string | "all") => void;
  onSelectSkill: (skillId: string | null) => void;
  onToggleSkillSelection: (skillId: string) => void;
  onToggleSelectAllVisible: () => void;
  onClearSelection: () => void;
  onBatchApply: (app: AppKind, enabled: boolean) => void;
  onOpenPath: (path: string) => void;
  onToggleApp: (skillId: string, app: AppKind, enabled: boolean) => void;
  onGenerateAiSummary?: () => void;
  onGenerateAiSummaryWithProvider?: (provider: AiSummaryProvider) => void;
  exportSelectionCount: number;
}

export function AppShell({
  loading,
  isDemoMode,
  sources,
  appCounts,
  skills,
  selectedSkill,
  selectedSkillIds,
  search,
  selectedSourceId,
  selectedInstallationState,
  selectedToolKind,
  batchBusy,
  usageMap,
  installedApps,
  aiSummary = null,
  selectedAiProvider = null,
  onSearchChange,
  onRefresh,
  onAddFolder,
  onImportZip,
  onExportSelected,
  onSelectInstallationState,
  onSelectToolKind,
  onSelectSource,
  onSelectSkill,
  onToggleSkillSelection,
  onToggleSelectAllVisible,
  onClearSelection,
  onBatchApply,
  onOpenPath,
  onToggleApp,
  onGenerateAiSummary,
  onGenerateAiSummaryWithProvider,
  exportSelectionCount,
}: AppShellProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const appFilters: Array<{
    key: AppKind;
    label: string;
    count: number;
    className: string;
    installed: boolean;
  }> = [
    {
      key: "claude",
      label: "Claude",
      count: appCounts.claude,
      className: "is-claude",
      installed: installedApps.claude ?? false,
    },
    {
      key: "codex",
      label: "Codex",
      count: appCounts.codex,
      className: "is-codex",
      installed: installedApps.codex ?? false,
    },
    {
      key: "gemini",
      label: "Gemini",
      count: appCounts.gemini,
      className: "is-gemini",
      installed: installedApps.gemini ?? false,
    },
    {
      key: "opencode",
      label: "OpenCode",
      count: appCounts.opencode,
      className: "is-opencode",
      installed: installedApps.opencode ?? false,
    },
  ];
  const activeFilterCount = [
    selectedToolKind !== "all",
    selectedInstallationState !== "all",
    selectedSourceId !== "all",
  ].filter(Boolean).length;

  return (
    <main className="app-shell">
      <header className="hero-bar">
        <div>
          <p className="eyebrow">Skills Dock</p>
          <h1>Skills 管理</h1>
        </div>
        <div className="toolbar">
          <button onClick={onRefresh} type="button">
            刷新索引
          </button>
          <button onClick={onAddFolder} type="button">
            导入已有
          </button>
          <button onClick={onImportZip} type="button">
            从 ZIP 安装
          </button>
          <button
            disabled={exportSelectionCount === 0}
            onClick={onExportSelected}
            type="button"
          >
            导出所选{exportSelectionCount > 0 ? ` (${exportSelectionCount})` : ""}
          </button>
          <DisabledHint disabled message="发现技能功能待开发">
            <button disabled type="button">
              发现技能
            </button>
          </DisabledHint>
        </div>
      </header>

      <section className="summary-strip">
        <div className="toolbar-search">
          <label className="search-field" htmlFor="skill-search">
            <span className="sr-only">Search skills</span>
            <input
              aria-label="Search skills"
              id="skill-search"
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              placeholder="搜索标题、摘要或来源目录"
              value={search}
            />
          </label>
        </div>
        <div className="summary-actions">
          <button
            aria-label="打开筛选"
            className={activeFilterCount > 0 || filtersOpen ? "chip is-active" : "chip"}
            onClick={() => setFiltersOpen((current) => !current)}
            type="button"
          >
            筛选{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          <div className="summary-pills">
            {appFilters.map((app) => (
              <DisabledHint
                key={app.key}
                disabled={!app.installed}
                message={`未安装 ${app.label}，无法筛选`}
              >
                <button
                  aria-label={`按 ${app.label} 筛选`}
                  className={
                    [
                      "summary-pill",
                      app.className,
                      selectedToolKind === app.key ? "is-active" : "",
                      !app.installed ? "is-disabled" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  disabled={!app.installed}
                  onClick={() => {
                    if (!app.installed) {
                      return;
                    }

                    onSelectToolKind(selectedToolKind === app.key ? "all" : app.key);
                  }}
                  title={app.installed ? app.label : `未安装 ${app.label}`}
                  type="button"
                >
                  {app.label}: {app.count}
                </button>
              </DisabledHint>
            ))}
          </div>
        </div>
      </section>



      {filtersOpen || activeFilterCount > 0 ? (
        <section className="filters-row">
          <label className="filter-field">
            <span>安装状态</span>
            <select
              aria-label="安装状态筛选"
              onChange={(event) =>
                onSelectInstallationState(
                  event.currentTarget.value as InstallationState | "all",
                )
              }
              value={selectedInstallationState}
            >
              <option value="all">全部状态</option>
              <option value="ready">正常</option>
              <option value="attention">异常</option>
              <option value="conflict">内容冲突</option>
              <option value="linked">符号链接</option>
              <option value="external">未知来源</option>
            </select>
          </label>
          <label className="filter-field">
            <span>来源目录</span>
            <select
              aria-label="来源目录筛选"
              onChange={(event) => onSelectSource(event.currentTarget.value as string | "all")}
              value={selectedSourceId}
            >
              <option value="all">全部来源</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="chip"
            onClick={() => {
              onSelectInstallationState("all");
              onSelectToolKind("all");
              onSelectSource("all");
              setFiltersOpen(false);
            }}
            type="button"
          >
            清空筛选
          </button>
        </section>
      ) : null}

      <div className="workspace-grid">
        <SkillsList
          batchBusy={batchBusy}
          loading={loading}
          onBatchApply={onBatchApply}
          onClearSelection={onClearSelection}
          onSelectSkill={onSelectSkill}
          onToggleSelectAllVisible={onToggleSelectAllVisible}
          onToggleSkillSelection={onToggleSkillSelection}
          onToggleApp={onToggleApp}
          selectedSkillId={selectedSkill?.id ?? null}
          selectedSkillIds={selectedSkillIds}
          skills={skills}
          sources={sources}
          usageMap={usageMap}
          installedApps={installedApps}
        />
      </div>

      {selectedSkill ? (
        <div className="modal-overlay" onClick={() => onSelectSkill(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button aria-label="关闭" className="modal-close-btn" onClick={() => onSelectSkill(null)} type="button">
              ×
            </button>
            <SkillDetailPanel
              aiSummary={aiSummary}
              onGenerateAiSummary={onGenerateAiSummary}
              onGenerateAiSummaryWithProvider={onGenerateAiSummaryWithProvider}
              onOpenPath={onOpenPath}
              selectedAiProvider={selectedAiProvider}
              skill={selectedSkill}
            />
          </div>
        </div>
      ) : null}

      {isDemoMode ? (
        <div className="demo-banner">⚠️ 演示模式 · 当前显示的是模拟数据，非本机真实 Skill 目录</div>
      ) : null}
    </main>
  );
}
