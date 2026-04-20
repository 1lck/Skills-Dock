import { countInstalledApps } from "../../lib/application/skills-catalog";
import type {
  AggregatedInstalledSkill,
  AppKind,
  SkillStatus,
  SourceRecord,
  ToolKind,
} from "../../lib/models/skill";
import { SkillDetailPanel } from "../detail/skill-detail";
import { SkillsList } from "../skills/skills-list";
import { SourceList } from "../sources/source-list";

interface AppShellProps {
  loading: boolean;
  isDemoMode: boolean;
  sources: SourceRecord[];
  skills: AggregatedInstalledSkill[];
  selectedSkill: AggregatedInstalledSkill | null;
  search: string;
  selectedSourceId: string | "all";
  selectedStatus: SkillStatus | "all";
  selectedToolKind: ToolKind | "all";
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onAddFolder: () => void;
  onSelectSource: (sourceId: string | "all") => void;
  onSelectStatus: (status: SkillStatus | "all") => void;
  onSelectToolKind: (toolKind: ToolKind | "all") => void;
  onSelectSkill: (skillId: string) => void;
  onOpenPath: (path: string) => void;
  onToggleApp: (skillId: string, app: AppKind, enabled: boolean) => void;
}

export function AppShell({
  loading,
  isDemoMode,
  sources,
  skills,
  selectedSkill,
  search,
  selectedSourceId,
  selectedStatus,
  selectedToolKind,
  onSearchChange,
  onRefresh,
  onAddFolder,
  onSelectSource,
  onSelectStatus,
  onSelectToolKind,
  onSelectSkill,
  onOpenPath,
  onToggleApp,
}: AppShellProps) {
  const toolCounts = countInstalledApps(skills);

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
          <button disabled type="button">
            从 ZIP 安装
          </button>
          <button disabled type="button">
            发现技能
          </button>
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
              placeholder="搜索名称、摘要或来源"
              value={search}
            />
          </label>
        </div>
        <div className="summary-pills">
          <span className="summary-pill is-claude">Claude: {toolCounts.claude}</span>
          <span className="summary-pill is-codex">Codex: {toolCounts.codex}</span>
          <span className="summary-pill is-gemini">Gemini: {toolCounts.gemini}</span>
          <span className="summary-pill is-opencode">OpenCode: {toolCounts.opencode}</span>
        </div>
      </section>

      {isDemoMode ? (
        <section className="demo-banner">
          当前是浏览器预览模式，列表使用演示数据。请运行桌面端以扫描本机 skills。
        </section>
      ) : null}

      <section className="filters-row">
        <select
          onChange={(event) => onSelectToolKind(event.currentTarget.value as ToolKind | "all")}
          value={selectedToolKind}
        >
          <option value="all">全部工具</option>
          <option value="codex">Codex</option>
          <option value="claude">Claude</option>
          <option value="generic">Generic</option>
          <option value="gemini">Gemini</option>
          <option value="opencode">OpenCode</option>
        </select>
        <select
          onChange={(event) => onSelectStatus(event.currentTarget.value as SkillStatus | "all")}
          value={selectedStatus}
        >
          <option value="all">全部状态</option>
          <option value="valid">valid</option>
          <option value="warning">warning</option>
          <option value="invalid">invalid</option>
        </select>
      </section>

      <div className="workspace-grid">
        <SourceList
          onSelectSource={onSelectSource}
          selectedSourceId={selectedSourceId}
          sources={sources}
        />
        <SkillsList
          loading={loading}
          onSelectSkill={onSelectSkill}
          onToggleApp={onToggleApp}
          selectedSkillId={selectedSkill?.id ?? null}
          skills={skills}
          sources={sources}
        />
        <SkillDetailPanel onOpenPath={onOpenPath} skill={selectedSkill} />
      </div>
    </main>
  );
}
