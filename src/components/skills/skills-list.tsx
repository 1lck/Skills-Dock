import type {
  AggregatedInstalledSkill,
  AppKind,
  SourceRecord,
} from "../../lib/models/skill";
import type { SkillUsageMap } from "../../lib/storage/skill-usage";

interface SkillsListProps {
  skills: AggregatedInstalledSkill[];
  sources: SourceRecord[];
  loading: boolean;
  selectedSkillId: string | null;
  selectedSkillIds: string[];
  batchBusy: boolean;
  usageMap: SkillUsageMap;
  installedApps: Record<string, boolean>;
  onSelectSkill: (id: string | null) => void;
  onToggleSkillSelection: (id: string) => void;
  onToggleSelectAllVisible: () => void;
  onClearSelection: () => void;
  onBatchApply: (app: AppKind, enabled: boolean) => void;
  onToggleApp: (skillId: string, app: AppKind, enabled: boolean) => void;
}

export function SkillsList({
  skills,
  sources,
  loading,
  selectedSkillIds,
  batchBusy,
  usageMap,
  installedApps,
  onSelectSkill,
  onToggleSkillSelection,
  onToggleSelectAllVisible,
  onClearSelection,
  onBatchApply,
  onToggleApp,
}: SkillsListProps) {
  const allVisibleSelected =
    skills.length > 0 && skills.every((skill) => selectedSkillIds.includes(skill.id));
  const someVisibleSelected =
    skills.length > 0 && skills.some((skill) => selectedSkillIds.includes(skill.id));

  return (
    <section className="skills-list">
      <header className="list-header">
        <label className="checkbox-cell">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            ref={(input) => {
              if (input) input.indeterminate = someVisibleSelected && !allVisibleSelected;
            }}
            onChange={onToggleSelectAllVisible}
          />
        </label>
        <span className="count-label">{skills.length}</span>
        {selectedSkillIds.length > 0 && (
          <div className="batch-actions">
            <span className="selection-count">已选 {selectedSkillIds.length} 项</span>
            <button className="text-button" onClick={onClearSelection} type="button">
              取消
            </button>
            <div className="divider" />
            <div className="batch-toggles">
              {(["claude", "codex", "gemini", "opencode"] as const).map((app) => {
                const isInstalled = installedApps[app] ?? false;
                return (
                  <div key={app} className={`batch-toggle-group ${!isInstalled ? "is-disabled" : ""}`}>
                    <span className="app-label">{labelForApp(app)}</span>
                    <button
                      className="icon-button small"
                      disabled={batchBusy || !isInstalled}
                      onClick={() => onBatchApply(app, true)}
                      title={isInstalled ? `批量安装到 ${labelForApp(app)}` : `未安装 ${labelForApp(app)}`}
                      type="button"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="icon-button small is-danger"
                      disabled={batchBusy || !isInstalled}
                      onClick={() => onBatchApply(app, false)}
                      title={isInstalled ? `批量从 ${labelForApp(app)} 移除` : `未安装 ${labelForApp(app)}`}
                      type="button"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <div className="list-body">
        {loading ? <p className="empty-state">正在扫描本地目录…</p> : null}
        {!loading && skills.length === 0 ? (
          <p className="empty-state">当前筛选条件下没有可显示的 skill。</p>
        ) : null}

        {skills.map((skill) => (
          <div key={skill.id} className="skill-row" data-state={skill.status}>
            <label className="checkbox-cell">
              <input
                type="checkbox"
                checked={selectedSkillIds.includes(skill.id)}
                onChange={() => onToggleSkillSelection(skill.id)}
              />
            </label>
            <button className="skill-info" onClick={() => onSelectSkill(skill.id)} type="button">
              <div className="title-row">
                <div className="title">
                  <strong>{skill.name}</strong>
                </div>
              </div>
            </button>
            <div className="skill-meta">
              <span className={`badge status is-${skill.installationState}`}>
                {labelForInstallationState(skill.installationState)}
              </span>
              <span
                className="call-count-badge"
                data-count={usageMap[skill.canonicalId]?.callCount ?? 0}
                title="Agent 调用次数"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1"/>
                  <path d="M3.5 5 L4.5 6 L6.5 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {usageMap[skill.canonicalId]?.callCount ?? 0}
              </span>
              <AppStatusRail skill={skill} sources={sources} installedApps={installedApps} onToggleApp={onToggleApp} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AppStatusRail({
  skill,
  sources,
  installedApps,
  onToggleApp,
}: {
  skill: AggregatedInstalledSkill;
  sources: SourceRecord[];
  installedApps: Record<string, boolean>;
  onToggleApp: (skillId: string, app: AppKind, enabled: boolean) => void;
}) {
  const apps = [
    { key: "claude", label: "Cl", active: skill.apps.claude, installed: installedApps.claude ?? false },
    { key: "codex", label: "Co", active: skill.apps.codex, installed: installedApps.codex ?? false },
    { key: "gemini", label: "Ge", active: skill.apps.gemini, installed: installedApps.gemini ?? false },
    { key: "opencode", label: "Op", active: skill.apps.opencode, installed: installedApps.opencode ?? false },
  ] as const;
  const customCount = skill.installations.filter(
    (installation) =>
      sources.find((source) => source.id === installation.sourceId)?.sourceType === "custom",
  ).length;

  return (
    <div className="app-status-rail">
      {apps.map((app) => (
        <button
          key={app.key}
          aria-label={`切换 ${labelForApp(app.key)} 安装状态`}
          className={`${app.active ? "app-pill is-active" : "app-pill"} ${!app.installed ? "is-disabled" : ""}`}
          onClick={() => app.installed && onToggleApp(skill.canonicalId, app.key, !app.active)}
          title={app.installed ? app.key : `未安装 ${labelForApp(app.key)}`}
          disabled={!app.installed}
          type="button"
        >
          {app.label}
        </button>
      ))}
      {customCount > 0 ? <span className="app-pill is-custom">+{customCount}</span> : null}
    </div>
  );
}

function labelForApp(app: AppKind): string {
  switch (app) {
    case "claude":
      return "Claude";
    case "codex":
      return "Codex";
    case "gemini":
      return "Gemini";
    case "opencode":
      return "OpenCode";
  }
}

function labelForInstallationState(state: AggregatedInstalledSkill["installationState"]): string {
  switch (state) {
    case "ready":
      return "正常";
    case "attention":
      return "异常";
    case "conflict":
      return "冲突";
    case "linked":
      return "链接";
    case "external":
      return "外部";
  }
}
