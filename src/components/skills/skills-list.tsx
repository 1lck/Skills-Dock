import type {
  AggregatedInstalledSkill,
  AppKind,
  SourceRecord,
} from "../../lib/models/skill";

interface SkillsListProps {
  skills: AggregatedInstalledSkill[];
  sources: SourceRecord[];
  loading: boolean;
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string) => void;
  onToggleApp: (skillId: string, app: AppKind, enabled: boolean) => void;
}

export function SkillsList({
  skills,
  sources,
  loading,
  selectedSkillId,
  onSelectSkill,
  onToggleApp,
}: SkillsListProps) {
  return (
    <section aria-label="Skills" className="skills-panel">
      <div className="section-heading">
        <div>
          <h2>已安装技能</h2>
          <p className="panel-subtitle">
            按来源、状态和兼容工具快速筛选本地 skill。
          </p>
        </div>
        <span className="count-badge">{skills.length}</span>
      </div>

      <div className="skills-list">
        {loading ? <p className="empty-state">正在扫描本地目录…</p> : null}
        {!loading && skills.length === 0 ? (
          <p className="empty-state">当前筛选条件下没有可显示的 skill。</p>
        ) : null}

        {skills.map((skill) => (
          <button
            key={skill.id}
            className={selectedSkillId === skill.id ? "skill-row is-active" : "skill-row"}
            onClick={() => onSelectSkill(skill.id)}
            type="button"
          >
            <div className="skill-copy">
              <div className="skill-title-line">
                <strong>{skill.name}</strong>
              </div>
            </div>
            <div className="skill-meta">
              <span className={`badge status is-${skill.status}`}>{skill.status}</span>
              <AppStatusRail skill={skill} sources={sources} onToggleApp={onToggleApp} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function AppStatusRail({
  skill,
  sources,
  onToggleApp,
}: {
  skill: AggregatedInstalledSkill;
  sources: SourceRecord[];
  onToggleApp: (skillId: string, app: AppKind, enabled: boolean) => void;
}) {
  const apps = [
    { key: "claude", label: "Cl", active: skill.apps.claude },
    { key: "codex", label: "Co", active: skill.apps.codex },
    { key: "gemini", label: "Ge", active: skill.apps.gemini },
    { key: "opencode", label: "Op", active: skill.apps.opencode },
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
          className={app.active ? "app-pill is-active" : "app-pill"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleApp(skill.canonicalId, app.key, !app.active);
          }}
          title={app.key}
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
