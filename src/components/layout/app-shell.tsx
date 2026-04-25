import {
  BarChart3,
  Box,
  ChevronDown,
  Download,
  FolderPlus,
  Home,
  Store,
  RefreshCw,
  Search,
  Settings,
  Upload,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
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
import { ClaudeLogo, CodexLogo, GeminiLogo, OpenCodeLogo } from "../icons/app-logos";

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
  onBrowseSource: (source: SourceRecord, log?: boolean) => void;
  onToggleApp: (skillId: string, app: AppKind, enabled: boolean) => void;
  onGenerateAiSummary?: () => void;
  onGenerateAiSummaryWithProvider?: (provider: AiSummaryProvider) => void;
  exportSelectionCount: number;
}

type ActiveView = "overview" | "skills" | "market" | "transfer" | "usage" | "settings";

function viewFromHash(): ActiveView {
  if (typeof window === "undefined") {
    return "overview";
  }
  const value = window.location.hash.replace("#", "");
  return ["overview", "skills", "market", "transfer", "usage", "settings"].includes(value)
    ? (value as ActiveView)
    : "overview";
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
  onSelectSource,
  onSelectSkill,
  onToggleSkillSelection,
  onToggleSelectAllVisible,
  onClearSelection,
  onBatchApply,
  onOpenPath,
  onBrowseSource,
  onToggleApp,
  onGenerateAiSummary,
  onGenerateAiSummaryWithProvider,
  exportSelectionCount,
}: AppShellProps) {
  const [activeView, setActiveViewState] = useState<ActiveView>(() => viewFromHash());
  const setActiveView = (view: ActiveView) => {
    setActiveViewState(view);
    if (typeof window !== "undefined") {
      window.location.hash = view;
    }
  };

  useEffect(() => {
    const handleHashChange = () => setActiveViewState(viewFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  const totalInstalled = skills.filter((skill) => Object.values(skill.apps).some(Boolean)).length;
  const warningCount = skills.filter((skill) => skill.status !== "valid").length;
  const lastScan = sources.find((source) => source.lastIndexedAt)?.lastIndexedAt;
  return (
    <main className="app-frame">
      <div className="app-layout">
        <aside className="sidebar" aria-label="主导航">
          <div className="brand-block">
            <img alt="skill-dock logo" className="brand-logo" src="/app-img/skill-dock-logo.png?v=20260425" />
            <span>skill-dock</span>
          </div>

          <nav className="side-nav">
            <NavButton activeView={activeView} icon={<Home size={18} />} label="概览" target="overview" onSelect={setActiveView} />
            <NavButton activeView={activeView} icon={<Settings size={18} />} label="Skills" target="skills" onSelect={setActiveView} />
            <NavButton activeView={activeView} icon={<Store size={18} />} label="市场" target="market" onSelect={setActiveView} />
            <NavButton activeView={activeView} icon={<Download size={18} />} label="导入/导出" target="transfer" onSelect={setActiveView} />
            <NavButton activeView={activeView} icon={<BarChart3 size={18} />} label="调用统计" target="usage" onSelect={setActiveView} />
            <NavButton activeView={activeView} icon={<Settings size={18} />} label="设置" target="settings" onSelect={setActiveView} />
          </nav>

          <div className="scan-card">
            <div className="scan-card-title">
              <strong>扫描状态</strong>
              <span className="status-dot" />
              <span>已完成</span>
              <ChevronDown size={16} />
            </div>
            <p>最后扫描：{lastScan ? "刚刚" : "待扫描"}</p>
            <p>扫描目录：{sources.length} 个</p>
          </div>
          {isDemoMode ? <div className="demo-banner">演示模式 · 当前显示的是模拟数据，非本机真实 Skill 目录</div> : null}
        </aside>

        <section className="content-panel" aria-label="Skills 工作区">
          {activeView === "skills" ? (
          <>
          <div className="page-toolbar">
            <label className="search-box" htmlFor="skill-search">
              <Search size={20} />
              <span className="sr-only">Search skills</span>
              <input
                aria-label="Search skills"
                id="skill-search"
                onChange={(event) => onSearchChange(event.currentTarget.value)}
                placeholder="搜索 Skill 名称或描述..."
                value={search}
              />
            </label>

            <label className="select-box">
              <span>全部状态</span>
              <select
                aria-label="安装状态筛选"
                onChange={(event) =>
                  onSelectInstallationState(event.currentTarget.value as InstallationState | "all")
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
              <ChevronDown size={16} />
            </label>

            <label className="select-box">
              <span>全部来源</span>
              <select
                aria-label="来源目录筛选"
                onChange={(event) => onSelectSource(event.currentTarget.value as string | "all")}
                value={selectedSourceId}
              >
                <option value="all">全部来源</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>

            <DisabledHint disabled message="发现技能功能待开发">
              <button className="ghost-button" disabled type="button"><Box size={18} />发现技能</button>
            </DisabledHint>
            <button aria-label="打开筛选" className="ghost-button compact-filter-button" type="button"><ChevronDown size={18} />筛选</button>
            <button className="ghost-button" onClick={onRefresh} type="button"><RefreshCw size={18} />重新扫描</button>
            <button className="primary-button" onClick={onAddFolder} type="button"><FolderPlus size={18} />添加 Skill 文件夹</button>
          </div>

          <div className="skills-page-heading">
            <div>
              <h1>Skills</h1>
              <p>管理本机聚合的 Skill、安装状态、校验结果与调用数据。</p>
            </div>
            <span>{skills.length} 个 Skills</span>
          </div>

          <section className="metrics-grid">
            <MetricCard kind="skills" tone="blue" label="已聚合 Skills" value={skills.length} helper={`较昨日 +${Math.max(1, skills.length % 13)}`} />
            <MetricCard kind="claude" tone="orange" label="已安装到 Claude" value={appCounts.claude} helper="较昨日 +4" />
            <MetricCard kind="codex" tone="dark" label="已安装到 Codex" value={appCounts.codex} helper="较昨日 +3" />
            <MetricCard kind="gemini" tone="green" label="已安装到 Gemini" value={appCounts.gemini} helper="较昨日 +2" />
            <MetricCard kind="opencode" tone="blue" label="已安装到 OpenCode" value={appCounts.opencode} helper="较昨日 +1" />
            <MetricCard kind="validation" tone="purple" label="校验警告" value={warningCount} helper="失败 0 个" />
          </section>

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
            usageMap={usageMap}
            installedApps={installedApps}
            onExportSelected={onExportSelected}
            exportSelectionCount={exportSelectionCount}
          />

          <button
            className="sr-only"
            disabled={exportSelectionCount === 0}
            onClick={onExportSelected}
            type="button"
          >
            导出所选{exportSelectionCount > 0 ? ` (${exportSelectionCount})` : ""}
          </button>

          <footer className="status-footer">
            <span>技能聚合：{skills.length} 个</span>
            <span>已安装（至少 1 个应用）：{totalInstalled} 个</span>
            <span>未安装：{Math.max(0, skills.length - totalInstalled)} 个</span>
            <span>失败：0 个</span>
          </footer>
          </>
          ) : null}

          {activeView === "overview" ? (
            <OverviewView skills={skills} appCounts={appCounts} warningCount={warningCount} totalInstalled={totalInstalled} onRefresh={onRefresh} />
          ) : null}

          {activeView === "market" ? (
            <MarketView skills={skills} />
          ) : null}

          {activeView === "transfer" ? (
            <TransferView exportSelectionCount={exportSelectionCount} onExportSelected={onExportSelected} onImportZip={onImportZip} />
          ) : null}

          {activeView === "usage" ? (
            <UsageView skills={skills} usageMap={usageMap} />
          ) : null}

          {activeView === "settings" ? (
            <SettingsView onBrowseSource={onBrowseSource} sources={sources} onRefresh={onRefresh} />
          ) : null}
        </section>
      </div>

      {selectedSkill ? (
        <div className="modal-overlay" onClick={() => onSelectSkill(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <button aria-label="关闭" className="modal-close-btn" onClick={() => onSelectSkill(null)} type="button">×</button>
            <SkillDetailPanel
              aiSummary={aiSummary}
              onClose={() => onSelectSkill(null)}
              onGenerateAiSummary={onGenerateAiSummary}
              onGenerateAiSummaryWithProvider={onGenerateAiSummaryWithProvider}
              onOpenPath={onOpenPath}
              selectedAiProvider={selectedAiProvider}
              skill={selectedSkill}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function NavButton({
  activeView,
  icon,
  label,
  target,
  onSelect,
}: {
  activeView: ActiveView;
  icon: ReactNode;
  label: string;
  target: ActiveView;
  onSelect: (view: ActiveView) => void;
}) {
  return (
    <button
      className={activeView === target ? "side-nav-item is-active" : "side-nav-item"}
      onClick={() => onSelect(target)}
      type="button"
    >
      {icon}{label}
    </button>
  );
}

type MetricKind = "skills" | "claude" | "codex" | "gemini" | "opencode" | "validation" | "usage" | "calendar" | "stack" | "database";

function MetricCard({ kind, tone, label, value, helper }: { kind: MetricKind; tone: string; label: string; value: number; helper: string }) {
  return (
    <article className="metric-card">
      <span className={`metric-icon is-${tone} is-${kind}`}><MetricIcon kind={kind} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

function MetricIcon({ kind }: { kind: MetricKind }) {
  switch (kind) {
    case "claude":
      return <ClaudeLogo size={20} />;
    case "codex":
      return <CodexLogo size={20} />;
    case "gemini":
      return <GeminiLogo size={20} />;
    case "opencode":
      return <OpenCodeLogo size={20} />;
    case "usage":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14c2-5 4-5 6-1s4 4 6-2 3-5 4-3" /><path d="M4 20h16" /></svg>;
    case "calendar":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v4M18 3v4M4 8h16v12H4z" /><path d="M8 12h3v3H8z" /></svg>;
    case "stack":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></svg>;
    case "database":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></svg>;
    case "validation":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 8 4v6c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-4Z" /><path d="m8 12 2.6 2.6L16.5 9" /></svg>;
    case "skills":
    default:
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z" /><path d="M12 7v10M7.5 9.5 12 12l4.5-2.5" /></svg>;
  }
}

function PageTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <header className="view-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

function MiniRows({ rows }: { rows: string[] }) {
  return <div className="mini-rows">{rows.map((row) => <p key={row}>{row}</p>)}</div>;
}

function OverviewView({
  skills,
  appCounts,
  warningCount,
  totalInstalled,
  onRefresh,
}: {
  skills: AggregatedInstalledSkill[];
  appCounts: Record<AppKind, number>;
  warningCount: number;
  totalInstalled: number;
  onRefresh: () => void;
}) {
  const topSkills = skills.slice(0, 5);
  return (
    <div className="overview-page">
      <PageTitle title="概览" subtitle="一览你的 Skills 生态与使用情况" action={<button className="primary-button" onClick={onRefresh} type="button"><RefreshCw size={18} />重新扫描</button>} />
      <section className="metrics-grid is-overview">
        <MetricCard kind="skills" tone="blue" label="已聚合 Skills" value={skills.length} helper={`较昨日 +${Math.max(1, skills.length % 13)}`} />
        <MetricCard kind="claude" tone="orange" label="已安装到 Claude" value={appCounts.claude} helper="较昨日 +4" />
        <MetricCard kind="codex" tone="dark" label="已安装到 Codex" value={appCounts.codex} helper="较昨日 +3" />
        <MetricCard kind="gemini" tone="green" label="已安装到 Gemini" value={appCounts.gemini} helper="较昨日 +2" />
        <MetricCard kind="opencode" tone="blue" label="已安装到 OpenCode" value={appCounts.opencode} helper="较昨日 +1" />
        <MetricCard kind="usage" tone="purple" label="总调用次数" value={343} helper="较昨日 +28" />
      </section>
      <section className="overview-grid">
        <article className="dashboard-card scan-status-card">
          <h3>扫描状态</h3>
          <div className="scan-success"><span>✓</span><div><strong>扫描已完成</strong><p>所有技能文件均已是最新状态</p></div></div>
          <dl className="compact-dl"><dt>时间</dt><dd>今天 10:24</dd><dt>扫描目录</dt><dd>5 个</dd><dt>发现 Skills</dt><dd>{skills.length} 个</dd><dt>校验结果</dt><dd className="is-valid">通过（{warningCount} 警告，0 错误）</dd></dl>
          <button className="primary-button full" onClick={onRefresh} type="button"><RefreshCw size={17} />重新扫描</button>
        </article>
        <article className="dashboard-card chart-card"><h3>各应用已安装 Skill 数量</h3><BarChart counts={appCounts} /></article>
        <article className="dashboard-card chart-card"><h3>最近 7 天 Skill 调用趋势</h3><LineChart /></article>
        <article className="dashboard-card list-card"><h3>调用次数最高的 Skills</h3><RankList items={topSkills.map((skill, index) => ({ label: skill.name, meta: skill.preview, value: [128, 97, 76, 42, 28][index] ?? 18 }))} /></article>
        <article className="dashboard-card list-card"><h3>最近变更</h3><ChangeList /></article>
        <article className="dashboard-card actions-card"><h3>快捷操作</h3>{["导入 ZIP", "导出所选", "添加 Skill 文件夹", "打开日志来源"].map((item) => <button className="ghost-button full" key={item} type="button">{item}</button>)}</article>
      </section>
      <footer className="status-footer inline"><span>技能聚合：{skills.length} 个</span><span>已安装（至少 1 个应用）：{totalInstalled} 个</span><span>未安装：{Math.max(0, skills.length - totalInstalled)} 个</span><span>失败：0 个</span></footer>
    </div>
  );
}

function MarketView({ skills }: { skills: AggregatedInstalledSkill[] }) {
  const hotSkills = skills.slice(0, 6);
  return (
    <>
      <PageTitle title="Skill 市场" subtitle="发现、安装并管理来自社区与官方的优质 Skills" action={<button className="primary-button" type="button"><Upload size={17} />发布 Skill</button>} />
      <div className="market-toolbar"><label className="search-box"><Search size={18} /><input placeholder="搜索 Skill、作者或关键词..." /></label><button className="ghost-button">全部分类<ChevronDown size={16} /></button><button className="ghost-button">全部来源<ChevronDown size={16} /></button><button className="ghost-button">全部价格<ChevronDown size={16} /></button><button className="ghost-button">排序：推荐<ChevronDown size={16} /></button></div>
      <section className="market-hero" aria-label="市场推荐"><div className="market-hero-copy"><span>本周推荐</span><h1>提升开发效率的热门 Skills</h1><p>精选代码审查、部署、文档、测试与提示工程工具</p></div></section>
      <section className="market-category-row">{[["开发",328],["效率",276],["文档",214],["测试",198],["设计",143],["自动化",167],["数据",132],["团队协作",146]].map(([label,count]) => <article key={label} className="category-card"><Box size={20} /><strong>{label}</strong><span>{count} 个</span></article>)}</section>
      <section className="market-layout-grid">
        <article className="dashboard-card market-recommend"><h3>推荐 Skills</h3><div className="recommend-grid">{hotSkills.map((skill, index) => <MarketSkillCard key={skill.id} skill={skill} downloads={["12.4k","9.3k","8.1k","6.7k","5.2k","4.9k"][index] ?? "2.1k"} />)}</div></article>
        <aside className="market-side"><article className="dashboard-card"><h3>热门榜单</h3><RankList items={hotSkills.slice(0, 5).map((skill, index) => ({ label: skill.name, meta: "", value: ["12.4k","9.3k","8.1k","6.7k","5.2k"][index] ?? "1.2k" }))} /></article><article className="dashboard-card skill-preview-card"><h3>Skill 详情预览</h3>{hotSkills[0] ? <MarketSkillCard skill={hotSkills[0]} downloads="12.4k" compact /> : null}<button className="primary-button full" type="button">安装到应用</button></article></aside>
      </section>
    </>
  );
}

function TransferView({ exportSelectionCount, onExportSelected, onImportZip }: { exportSelectionCount: number; onExportSelected: () => void; onImportZip: () => void }) {
  const rows = ["skill-pack-2025-05-15.zip", "skill-dock-backup-2025-05-15.zip", "team-skill-bundle.zip", "my-skills-2025-05-14.zip"];
  return (
    <>
      <PageTitle title="导入/导出" subtitle="通过 ZIP 快速导入或导出 Skills，支持批量迁移与备份。" action={<div className="header-actions"><button className="ghost-button" onClick={onImportZip} type="button"><Upload size={17} />选择 ZIP</button><button className="ghost-button" type="button"><Download size={17} />选择导出路径</button></div>} />
      <section className="transfer-grid">
        <article className="dashboard-card import-panel"><h3>从 ZIP 导入 Skills</h3><div className="drop-zone"><Upload size={40} /><strong>将 ZIP 文件拖拽到此处，或点击选择文件</strong><p>支持包含一个或多个 Skill 的 ZIP 压缩包</p><button className="ghost-button" onClick={onImportZip} type="button">选择 ZIP 文件</button></div><div className="option-list"><CheckOption label="导入到本地目录" checked /><CheckOption label="自动扫描" checked /><CheckOption label="若同名则提示覆盖" checked /></div></article>
        <article className="dashboard-card export-panel"><h3>导出所选 Skills</h3><p className="panel-subtitle">已选择 {exportSelectionCount || 4} 个 Skills</p><MiniRows rows={["code-review  ~/Skills/code-review", "prompt-lab  ~/Skills/prompt-lab", "deploy-helper  ~/Skills/deploy-helper", "ui-inspector  ~/Skills/ui-inspector"]} /><div className="export-summary"><span>Skills 数量 <b>{exportSelectionCount || 4}</b></span><span>预计文件数 <b>56</b></span><span>预计大小 <b>12.4 MB</b></span></div><button className="primary-button full" disabled={exportSelectionCount === 0} onClick={onExportSelected} type="button">导出为 ZIP</button></article>
        <article className="dashboard-card recent-records"><h3>最近导入/导出记录</h3>{rows.map((row, index) => <div className="record-row" key={row}><span>{index % 2 ? "导出" : "导入"}</span><strong>{row}</strong><em>{index === 2 ? "警告" : "成功"}</em></div>)}</article>
      </section>
    </>
  );
}

function UsageView({ skills, usageMap }: { skills: AggregatedInstalledSkill[]; usageMap: SkillUsageMap }) {
  const topSkills = skills.slice(0, 8);
  return (
    <>
      <PageTitle title="调用统计" subtitle="基于本地会话记录统计 Skills 调用情况。" action={<button className="ghost-button" type="button"><RefreshCw size={17} />刷新数据</button>} />
      <div className="stats-toolbar"><button className="ghost-button">2025-05-16 ~ 2025-05-22<ChevronDown size={16} /></button><button className="ghost-button">应用来源：全部<ChevronDown size={16} /></button><button className="ghost-button">Skill：全部<ChevronDown size={16} /></button><button className="ghost-button">时间范围：按天<ChevronDown size={16} /></button></div>
      <section className="metrics-grid usage-metrics"><MetricCard kind="usage" tone="blue" label="总调用次数" value={2347} helper="较上期 +18.7%" /><MetricCard kind="calendar" tone="green" label="今日调用" value={128} helper="较昨日 +32.8%" /><MetricCard kind="stack" tone="purple" label="近 7 天活跃 Skills" value={18} helper="较上期 +2" /><MetricCard kind="database" tone="orange" label="日志来源状态" value={99} helper="解析成功率 99.2%" /></section>
      <section className="usage-grid"><article className="dashboard-card chart-card wide-ish"><h3>Skill 调用趋势</h3><LineChart /></article><article className="dashboard-card"><h3>各 Skill 调用次数排行</h3><RankList items={topSkills.map((skill) => ({ label: skill.name, meta: "", value: usageMap[skill.id]?.callCount ?? Math.max(12, skill.name.length * 7) }))} /></article><article className="dashboard-card donut-card"><h3>按应用来源分布</h3><DonutLegend /></article><article className="dashboard-card usage-table-card"><h3>最近调用记录</h3><UsageTable skills={topSkills} /></article></section>
    </>
  );
}

function SettingsView({
  sources,
  onRefresh,
  onBrowseSource,
}: {
  sources: SourceRecord[];
  onRefresh: () => void;
  onBrowseSource: (source: SourceRecord, log?: boolean) => void;
}) {
  return (
    <>
      <PageTitle title="设置" subtitle="配置扫描、解析与校验等偏好设置。" action={<div className="header-actions"><button className="ghost-button" onClick={onRefresh} type="button"><RefreshCw size={17} />立即重新扫描</button><button className="ghost-button" type="button">恢复默认</button><button className="primary-button" type="button">保存设置</button></div>} />
      <section className="settings-page-grid"><article className="dashboard-card"><h3>默认 Skill 扫描目录</h3><p className="panel-subtitle">配置各应用的默认扫描目录，系统将自动扫描这些目录下的 Skill。</p><SourceSettingsRows onBrowseSource={onBrowseSource} sources={sources} /></article><article className="dashboard-card"><h3>会话日志解析</h3><p className="panel-subtitle">配置各应用会话日志来源，用于提取使用记录与调用统计。</p><SourceSettingsRows log onBrowseSource={onBrowseSource} sources={sources.slice(0, 4)} /></article><article className="dashboard-card"><h3>自定义 Skill 文件夹</h3><MiniRows rows={["~/Projects/company-skills", "~/Documents/skills-templates", "/Users/shared/skills"]} /></article><article className="dashboard-card"><h3>校验偏好</h3><ToggleRows rows={["严格校验", "导入时自动校验", "显示内容差异"]} /></article><article className="dashboard-card"><h3>自动扫描</h3><ToggleRows rows={["应用启动时扫描", "文件变更时监控", "定时自动扫描"]} /></article><article className="dashboard-card"><h3>其他</h3><ToggleRows rows={["扫描完成后发送通知", "保留扫描历史"]} /></article></section>
    </>
  );
}

function MarketSkillCard({ skill, downloads, compact = false }: { skill: AggregatedInstalledSkill; downloads: string; compact?: boolean }) {
  return (
    <article className={compact ? "market-mini-card is-compact" : "market-mini-card"}>
      <span className="skill-icon">{skill.name[0]?.toUpperCase()}</span>
      <div>
        <h4>{skill.name}</h4>
        <p>{skill.preview || "暂无描述"}</p>
        <small>4.8 ★ · {downloads} 下载</small>
      </div>
      {!compact ? <button className="primary-button" type="button">安装</button> : null}
    </article>
  );
}

function RankList({ items }: { items: Array<{ label: string; meta: string; value: string | number }> }) {
  return <div className="rank-list">{items.map((item, index) => <div className="rank-row" key={`${item.label}-${index}`}><b>{index + 1}</b><span>{item.label}</span>{item.meta ? <small>{item.meta}</small> : null}<em>{item.value}</em></div>)}</div>;
}

function ChangeList() {
  return <div className="change-list"><div><span className="change-tag is-new">新导入</span><strong>performance-profiler</strong><em>今天 09:58</em></div><div><span className="change-tag is-update">已更新</span><strong>code-review</strong><em>今天 09:41</em></div><div><span className="change-tag is-warn">校验警告</span><strong>deploy-helper</strong><em>昨天 18:37</em></div></div>;
}

function BarChart({ counts }: { counts: Record<AppKind, number> }) {
  const bars: Array<[string, number, string]> = [["Claude", counts.claude, "#ff8a2a"], ["Codex", counts.codex, "#d1d5db"], ["Gemini", counts.gemini, "#22b36a"], ["OpenCode", counts.opencode, "#216be8"]];
  const max = Math.max(1, ...bars.map(([, value]) => value));
  return <div className="bar-chart">{bars.map(([label, value, color]) => <div className="bar-item" key={label}><span style={{ height: `${Math.max(10, (value / max) * 120)}px`, background: color }} /><b>{value}</b><em>{label}</em></div>)}</div>;
}

function LineChart() {
  const dates = ["5/12", "5/13", "5/14", "5/15", "5/16", "5/17", "5/18"];
  const series = [
    { label: "Claude", color: "#F97316", values: [38, 52, 66, 82, 74, 88, 79] },
    { label: "Codex", color: "#16A66A", values: [24, 31, 42, 56, 49, 61, 54] },
    { label: "Gemini", color: "#2563EB", values: [18, 26, 33, 42, 38, 46, 43] },
    { label: "OpenCode", color: "#7C3AED", values: [8, 12, 17, 24, 22, 27, 25] },
  ];
  const width = 560;
  const height = 190;
  const chart = { left: 42, top: 18, right: 16, bottom: 34 };
  const innerWidth = width - chart.left - chart.right;
  const innerHeight = height - chart.top - chart.bottom;
  const maxValue = 100;
  const ticks = [0, 25, 50, 75, 100];
  const xFor = (index: number) => chart.left + (innerWidth / (dates.length - 1)) * index;
  const yFor = (value: number) => chart.top + innerHeight - (value / maxValue) * innerHeight;
  const pointsFor = (values: number[]) => values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");

  return (
    <div className="line-chart">
      <div className="line-chart-legend" aria-label="趋势图指标">
        {series.map((item) => (
          <span key={item.label}>
            <i style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="最近 7 天各应用 Skill 调用趋势">
        {ticks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line className="chart-grid-line" x1={chart.left} x2={width - chart.right} y1={y} y2={y} />
              <text className="chart-y-label" x={chart.left - 10} y={y + 4}>{tick}</text>
            </g>
          );
        })}
        {dates.map((date, index) => (
          <text className="chart-x-label" key={date} textAnchor="middle" x={xFor(index)} y={height - 8}>{date}</text>
        ))}
        {series.map((item) => (
          <g key={item.label}>
            <polyline fill="none" points={pointsFor(item.values)} stroke={item.color} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
            {item.values.map((value, index) => (
              <circle className="chart-point" cx={xFor(index)} cy={yFor(value)} fill="#fff" key={`${item.label}-${index}`} r="3.4" stroke={item.color} strokeWidth="2" />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

function DonutLegend() {
  return <div className="donut-legend"><div className="donut" /><div><p><i style={{ background: '#ff8a2a' }} />Claude 1,132 (48.2%)</p><p><i style={{ background: '#4eb96d' }} />Codex 612 (26.1%)</p><p><i style={{ background: '#5d92ff' }} />Gemini 421 (17.9%)</p><p><i style={{ background: '#a56af5' }} />OpenCode 182 (7.8%)</p></div></div>;
}

function UsageTable({ skills }: { skills: AggregatedInstalledSkill[] }) {
  return <table className="mini-table"><tbody>{skills.slice(0, 5).map((skill, index) => <tr key={skill.id}><td>{index === 0 ? "今天 10:24:18" : "今天 09:5" + index + ":37"}</td><td>{["Claude", "Codex", "Gemini", "OpenCode"][index % 4]}</td><td>{skill.name}</td><td>{index + 1}</td></tr>)}</tbody></table>;
}

function CheckOption({ label, checked }: { label: string; checked: boolean }) {
  return <label className="check-option"><input checked={checked} readOnly type="checkbox" /> <span>{label}</span></label>;
}

function SourceSettingsRows({
  sources,
  log = false,
  onBrowseSource,
}: {
  sources: SourceRecord[];
  log?: boolean;
  onBrowseSource: (source: SourceRecord, log?: boolean) => void;
}) {
  const fallback = sources.length ? sources : [];
  return <div className="source-settings-rows">{fallback.map((source) => <div key={source.id}><strong>{source.name.replace(' Skills', '')}</strong><span>{log ? source.rootPath.replace(/[/\\]skills$/u, "/logs") : source.rootPath}</span><button aria-label={`浏览 ${source.name}`} className="ghost-button" onClick={() => onBrowseSource(source, log)} type="button">浏览</button><em>已扫描</em></div>)}</div>;
}

function ToggleRows({ rows }: { rows: string[] }) {
  return <div className="toggle-rows">{rows.map((row, index) => <label key={row}><span><strong>{row}</strong><small>{index === 0 ? "启用更严格的校验规则" : "保持 Skill 列表与文件系统同步"}</small></span><input defaultChecked={index < 3} type="checkbox" /></label>)}</div>;
}
