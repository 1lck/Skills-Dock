import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Download,
  Eye,
  FileText,
  FlaskConical,
  MoreHorizontal,
  Rocket,
  Settings,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import type {
  AppKind,
  SkillBundle,
} from "../../lib/models/skill";
import type { SkillUsageMap } from "../../lib/storage/skill-usage";
import { DisabledHint } from "../common/disabled-hint";
import { AppLogo } from "../icons/app-logos";

interface SkillsListProps {
  skills: SkillBundle[];
  loading: boolean;
  selectedSkillId: string | null;
  selectedSkillIds: string[];
  batchBusy: boolean;
  usageMap: SkillUsageMap;
  installedApps: Record<string, boolean>;
  onSelectSkill: (skillId: string) => void;
  onToggleSkillSelection: (skillId: string) => void;
  onToggleSelectAllVisible: () => void;
  onCreateBundle: () => void;
  onClearSelection: () => void;
  onBatchApply: (app: AppKind, enabled: boolean) => void;
  onToggleApp: (skillId: string, app: AppKind, enabled: boolean) => void;
  onExportSelected?: () => void;
  exportSelectionCount?: number;
}

const appKinds: Array<{ key: AppKind; label: string }> = [
  { key: "claude", label: "Claude" },
  { key: "codex", label: "Codex" },
  { key: "gemini", label: "Gemini" },
  { key: "opencode", label: "OpenCode" },
];

export function SkillsList({
  skills,
  loading,
  selectedSkillId,
  selectedSkillIds,
  batchBusy,
  usageMap,
  installedApps,
  onSelectSkill,
  onToggleSkillSelection,
  onToggleSelectAllVisible,
  onCreateBundle,
  onClearSelection,
  onBatchApply,
  onToggleApp,
  onExportSelected,
  exportSelectionCount = 0,
}: SkillsListProps) {
  const selectedCount = selectedSkillIds.length;

  if (loading) {
    return <section className="table-card bundles-table-card"><p className="empty-state">正在扫描本机 Bundles...</p></section>;
  }

  if (skills.length === 0) {
    return <section className="table-card bundles-table-card"><p className="empty-state">没有找到匹配的 Bundles。</p></section>;
  }

  return (
    <section className="table-card bundles-table-card" aria-label="Bundles 列表">
      <div className="table-actionbar">
        <label className="selection-summary">
          <input
            aria-label="选择所有可见 Bundles"
            checked={selectedCount > 0 && selectedCount === skills.length}
            onChange={onToggleSelectAllVisible}
            ref={(input) => {
              if (input) {
                input.indeterminate = selectedCount > 0 && selectedCount < skills.length;
              }
            }}
            type="checkbox"
          />
          <strong>已选择 {selectedCount} 项（共 {skills.length} 项）</strong>
        </label>
        <div className="batch-actions">
          <button disabled={selectedCount === 0} onClick={onExportSelected} type="button"><Download size={16} />导出 ZIP{exportSelectionCount > 0 ? ` (${exportSelectionCount})` : ""}</button>
          <button disabled={selectedCount === 0} onClick={onCreateBundle} type="button"><Settings size={16} />整合为本地包</button>
          <button disabled={selectedCount === 0 || batchBusy} onClick={() => onBatchApply("codex", true)} type="button"><Settings size={16} />安装到选中应用</button>
          <button disabled={selectedCount === 0} onClick={onClearSelection} type="button"><Trash2 size={16} />清除选择</button>
          <button type="button"><MoreHorizontal size={16} /></button>
        </div>
      </div>

      <div className="skills-table-wrap">
        <table className="skills-table">
          <thead>
            <tr>
              <th aria-label="选择" />
              <th>Bundle 名称</th>
              <th>描述</th>
              <th>校验状态</th>
              <th colSpan={4}>安装状态</th>
              <th>调用次数</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill) => {
              const selected = selectedSkillIds.includes(skill.id);
              return (
                <tr key={skill.id} className={[selected || selectedSkillId === skill.id ? "is-selected" : "", skill.status !== "valid" ? "has-warning" : ""].filter(Boolean).join(" ")}>
                  <td>
                    <input
                      aria-label={`选择 ${skill.name}`}
                      checked={selected}
                      onChange={() => onToggleSkillSelection(skill.id)}
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <button aria-label={skill.name} className="skill-name-button" onClick={() => onSelectSkill(skill.id)} type="button">
                      <SkillIcon name={skill.name} status={skill.status} />
                      <span>
                        {skill.name}
                        <small>{skill.memberCount} 个成员</small>
                        <small>{skill.originType === "custom" ? "本地整合包" : "来源包"} · {labelForSyncStatus(skill.syncStatus)}</small>
                      </span>
                    </button>
                  </td>
                  <td className="skill-description">
                    {skill.preview || "暂无描述"}
                    <small>{skill.members.map((member) => member.name).join(" / ")}</small>
                  </td>
                  <td><StatusBadge status={skill.status} /></td>
                  {appKinds.map((app) => (
                    <td key={app.key}>
                      <DisabledHint disabled={!installedApps[app.key]} message={`未安装 ${app.label}，无法切换`}>
                        <button
                          aria-label={`切换 ${app.label} 安装状态`}
                          className={[
                            "install-toggle",
                            `is-${app.key}`,
                            skill.apps[app.key] ? "is-on" : "",
                            !installedApps[app.key] ? "is-disabled" : "",
                          ].filter(Boolean).join(" ")}
                          disabled={!installedApps[app.key]}
                          onClick={() => {
                            if (installedApps[app.key]) {
                              onToggleApp(skill.id, app.key, !skill.apps[app.key]);
                            }
                          }}
                          type="button"
                        >
                          <AppLogo app={app.key} size={16} />
                        </button>
                      </DisabledHint>
                    </td>
                  ))}
                  <td>{skill.usageCount || usageMap[skill.id]?.callCount || fallbackUsage(skill.name)}</td>
                  <td>{formatUpdated(skill.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SkillIcon({ name, status }: { name: string; status: SkillBundle["status"] }) {
  const Icon = iconForSkill(name);
  return (
    <span aria-hidden="true" className={`skill-icon ${status !== "valid" ? "is-warning" : ""}`}>
      <Icon size={16} />
    </span>
  );
}

function StatusBadge({ status }: { status: SkillBundle["status"] }) {
  if (status === "valid") {
    return <span className="status-badge is-valid"><CheckCircle2 size={15} />通过</span>;
  }
  if (status === "warning") {
    return <span className="status-badge is-warning"><AlertTriangle size={15} />警告</span>;
  }
  return <span className="status-badge is-error"><XCircle size={15} />失败</span>;
}

function iconForSkill(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("review") || normalized.includes("code")) return Code2;
  if (normalized.includes("prompt") || normalized.includes("lab") || normalized.includes("test")) return FlaskConical;
  if (normalized.includes("deploy") || normalized.includes("release")) return Rocket;
  if (normalized.includes("ui") || normalized.includes("inspect")) return Eye;
  if (normalized.includes("doc") || normalized.includes("write")) return FileText;
  return Wrench;
}

function formatUpdated(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function fallbackUsage(name: string): number {
  return Math.max(12, name.length * 7);
}

function labelForSyncStatus(status: SkillBundle["syncStatus"]): string {
  switch (status) {
    case "unmanaged":
      return "未纳入同步";
    case "idle":
      return "待配置";
    case "pending":
      return "待同步";
    case "synced":
      return "已同步";
    case "drifted":
      return "有漂移";
  }
}
