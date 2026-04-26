import {
  CheckCircle2,
  Cloud,
  Code2,
  ExternalLink,
  Eye,
  FileArchive,
  FileText,
  FlaskConical,
  FolderOpen,
  MessageCircle,
  MoreHorizontal,
  Rocket,
  ShieldCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";

import type { AiSummaryProvider, AiSummaryState } from "../../lib/models/ai-summary";
import type { AggregatedInstalledSkill, AppKind, SkillBundle } from "../../lib/models/skill";
import { AppLogo } from "../icons/app-logos";

interface SkillDetailProps {
  skill: SkillBundle | null;
  availableSkills?: AggregatedInstalledSkill[];
  onOpenPath: (path: string) => void;
  onRenameBundle?: (bundleId: string, name: string) => void;
  onDeleteBundle?: (bundleId: string) => void;
  onToggleBundleMember?: (bundleId: string, memberId: string) => void;
  onSetBundleDesiredApp?: (bundleId: string, app: AppKind, enabled: boolean) => void;
  onSyncBundle?: (bundleId: string) => void;
  onRepairBundle?: (bundleId: string) => void;
  aiSummary?: AiSummaryState | null;
  selectedAiProvider?: AiSummaryProvider | null;
  onGenerateAiSummary?: () => void;
  onGenerateAiSummaryWithProvider?: (provider: AiSummaryProvider) => void;
  onClose?: () => void;
}

const appLabels: Record<AppKind, string> = {
  claude: "Claude",
  codex: "Codex",
  gemini: "Gemini",
  opencode: "OpenCode",
};

export function SkillDetailPanel({
  skill,
  availableSkills = [],
  onOpenPath,
  onRenameBundle,
  onDeleteBundle,
  onToggleBundleMember,
  onSetBundleDesiredApp,
  onSyncBundle,
  onRepairBundle,
  aiSummary = null,
  selectedAiProvider = null,
  onGenerateAiSummary,
  onGenerateAiSummaryWithProvider,
  onClose,
}: SkillDetailProps) {
  const [bundleName, setBundleName] = useState("");

  useEffect(() => {
    setBundleName(skill?.name ?? "");
  }, [skill?.id, skill?.name]);

  if (!skill) {
    return (
      <section aria-label="Skill Detail" className="detail-panel">
        <p className="empty-state">Select a skill to inspect its files and validation status.</p>
      </section>
    );
  }

  const installedAppCount = Object.values(skill.apps).filter(Boolean).length;
  const primary = skill.primarySkill?.primaryInstallation ?? null;
  const Icon = iconForSkill(skill.name);
  const isCustomBundle = skill.originType === "custom";
  const selectedMemberIds = new Set(skill.members.map((member) => member.canonicalId));
  const memberNames = skill.members.map((member) => member.name);
  const scenarioTags = deriveScenarioTags(skill);

  return (
    <section aria-label="Skill Detail" className="detail-panel">
      <div className="detail-page-header">
        <button className="text-button" onClick={onClose} type="button">‹ 返回</button>
        <div className="detail-hero">
          <span className={`detail-icon ${skill.status !== "valid" ? "is-warning" : ""}`}><Icon size={34} /></span>
          <div className="detail-title-group">
            <h2>{skill.name}</h2>
            <p>{skill.preview || "暂无描述"}</p>
            <div className="tag-row">
              <span>{isCustomBundle ? "本地整合包" : "来源包"}</span>
              <span>{skill.memberCount} 个成员 Skill</span>
              <span>{labelForSyncStatus(skill.syncStatus)}</span>
            </div>
          </div>
          <div className="detail-actions-main">
            {isCustomBundle ? (
              <button className="primary-button" onClick={() => onSyncBundle?.(skill.id)} type="button"><Cloud size={17} />同步本地包</button>
            ) : (
              <button className="primary-button" type="button"><Cloud size={17} />安装到应用</button>
            )}
            {isCustomBundle ? (
              <button className="ghost-button" onClick={() => onRepairBundle?.(skill.id)} type="button"><Wrench size={17} />修复目标应用</button>
            ) : (
              <button className="ghost-button" type="button"><XCircle size={17} />从应用移除</button>
            )}
            {primary ? <button className="ghost-button" onClick={() => onOpenPath(primary.skillPath)} type="button"><FolderOpen size={17} />打开文件夹</button> : null}
            <button className="ghost-button" type="button"><FileArchive size={17} />导出 ZIP</button>
            <button className="ghost-button icon-only" type="button"><MoreHorizontal size={17} /></button>
          </div>
        </div>
      </div>

      <div className="detail-content-grid">
        <div className="detail-main-column">
          <article className="markdown-card overview-card">
            <div className="card-heading">
              <h3>Bundle 概览</h3>
              {primary ? <button className="ghost-button" onClick={() => onOpenPath(primary.skillFilePath)} type="button">在编辑器中打开原始 SKILL.md <ExternalLink size={14} /></button> : null}
            </div>
            <div className="overview-stack">
              <section className="summary-block">
                <strong>适合场景</strong>
                <p>{skill.preview || "用于统一组织和管理一组相关技能。"}</p>
              </section>
              <section className="summary-block">
                <strong>你可以怎么用</strong>
                <ul className="summary-list">
                  <li>查看这个 bundle 包含哪些成员技能。</li>
                  <li>确认它已经安装到哪些应用。</li>
                  <li>{isCustomBundle ? "为本地整合包配置同步目标并执行同步。" : "从来源包快速跳转到原始技能目录。"}</li>
                </ul>
              </section>
              <section className="summary-block">
                <strong>包含成员</strong>
                <div className="chip-list">
                  {memberNames.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </div>
              </section>
              <section className="summary-block">
                <strong>主题标签</strong>
                <div className="chip-list">
                  {scenarioTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </section>
              <p className="muted-note">原始技能文档默认隐藏。这里优先展示适合用户阅读的摘要信息，避免把面向 Agent 的长篇英文规则直接暴露给用户。</p>
            </div>
          </article>

          <article className="diff-card compact-members-card">
            <div className="card-heading">
              <h3>成员 Skills</h3>
              <span className="change-badge">{skill.memberCount} 个成员</span>
            </div>
            <div className="diff-table" aria-label="成员 Skills 列表">
              {skill.members.map((member, index) => (
                <p key={member.id}>
                  <span>{index + 1}</span>
                  <ins>{member.name} · {member.preview || "暂无说明"}</ins>
                </p>
              ))}
            </div>
          </article>

          <AiSummarySection
            aiSummary={aiSummary}
            onGenerateAiSummary={onGenerateAiSummary}
            onGenerateAiSummaryWithProvider={onGenerateAiSummaryWithProvider}
            selectedAiProvider={selectedAiProvider}
          />
        </div>

        <aside className="detail-side-column">
          {isCustomBundle ? (
            <article className="meta-card">
              <h3>本地整合包管理</h3>
              <label className="search-box">
                <input
                  aria-label="Bundle 名称"
                  onChange={(event) => setBundleName(event.currentTarget.value)}
                  value={bundleName}
                />
              </label>
              <div className="batch-actions">
                <button className="primary-button" onClick={() => onRenameBundle?.(skill.id, bundleName)} type="button">保存名称</button>
                <button className="ghost-button" onClick={() => onDeleteBundle?.(skill.id)} type="button">删除本地包</button>
              </div>
            </article>
          ) : null}

          <article className="meta-card">
            <h3>当前状态</h3>
            <ValidationRow label="文件完整性" ok />
            <ValidationRow label="YAML front matter" ok />
            <ValidationRow label="Schema 校验" ok />
            <ValidationRow label="引用文件检查" ok={skill.status === "valid"} warning={skill.status !== "valid"} />
          </article>

          <article className="meta-card">
            <h3>安装位置</h3>
            <div className="installations-list">
              {(Object.keys(appLabels) as AppKind[]).map((app) => {
                const installation = skill.members
                  .flatMap((member) => member.installations)
                  .find((item) => item.toolKind === app);
                return (
                  <div className="installation-row" key={app}>
                    <span className={`source-icon is-${app}`}><AppLogo app={app} size={16} /></span>
                    <div>
                      <strong>{appLabels[app]}</strong>
                      <p>{shortPath(installation?.skillPath ?? `~/.${app}/skills/${skill.canonicalId}`)}</p>
                    </div>
                    <span className={skill.apps[app] ? "install-state is-installed" : "install-state"}>{skill.apps[app] ? "已安装" : "未安装"}</span>
                    {installation ? <button className="tiny-button" onClick={() => onOpenPath(installation.skillPath)} type="button">•••</button> : null}
                  </div>
                );
              })}
            </div>
          </article>

          <article className="meta-card metadata-card">
            <h3>基础信息</h3>
            <dl>
              <dt>来源类型</dt><dd>{skill.originType === "custom" ? "本地整合包" : "来源包"}</dd>
              <dt>同步状态</dt><dd>{labelForSyncStatus(skill.syncStatus)}</dd>
              <dt>成员数量</dt><dd>{skill.memberCount}</dd>
              <dt>更新时间</dt><dd>{formatUpdated(skill.updatedAt)}</dd>
              <dt>来源目录</dt><dd>{shortPath(primary?.sourcePath ?? skill.sourcePaths[0] ?? "—")}</dd>
            </dl>
          </article>

          {isCustomBundle ? (
            <article className="meta-card">
              <h3>目标应用配置</h3>
              <div className="toggle-rows">
                {(Object.keys(appLabels) as AppKind[]).map((app) => (
                  <label key={app}>
                    <span>
                      <strong>{appLabels[app]}</strong>
                      <small>{skill.desiredApps[app] ? "会在同步时安装所选成员" : "未纳入本地包同步目标"}</small>
                    </span>
                    <input
                      checked={skill.desiredApps[app]}
                      onChange={(event) =>
                        onSetBundleDesiredApp?.(skill.id, app, event.currentTarget.checked)
                      }
                      type="checkbox"
                    />
                  </label>
                ))}
              </div>
              {skill.missingMemberSkillIds.length > 0 ? (
                <p className="ai-summary-error">缺失成员：{skill.missingMemberSkillIds.join("、")}</p>
              ) : null}
            </article>
          ) : null}

          {isCustomBundle ? (
            <article className="meta-card">
              <h3>成员管理</h3>
              <div className="toggle-rows">
                {availableSkills.map((member) => (
                  <label key={member.canonicalId}>
                    <span>
                      <strong>{member.name}</strong>
                      <small>{member.preview || "暂无描述"}</small>
                    </span>
                    <input
                      checked={selectedMemberIds.has(member.canonicalId)}
                      onChange={() => onToggleBundleMember?.(skill.id, member.canonicalId)}
                      type="checkbox"
                    />
                  </label>
                ))}
              </div>
            </article>
          ) : null}

          <div className="mini-card-grid">
            <article className="meta-card mini-card">
              <h3>兼容应用</h3>
              <div className="compat-icons">
                {(Object.keys(appLabels) as AppKind[]).map((app) => <span key={app} className={`source-icon is-${app}`}><AppLogo app={app} size={14} /></span>)}
              </div>
              <p>已兼容 {installedAppCount} 个应用</p>
            </article>
            <article className="meta-card mini-card">
              <h3>最近调用</h3>
              <strong className="call-count">128</strong>
              <p>今天 10:24</p>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ValidationRow({ label, ok, warning = false }: { label: string; ok: boolean; warning?: boolean }) {
  return (
    <div className="validation-row">
      <span><ShieldCheck size={16} />{label}</span>
      <strong className={warning ? "is-warning" : "is-valid"}>{ok ? <CheckCircle2 size={15} /> : "!"} {warning ? "警告 (1)" : "通过"}</strong>
    </div>
  );
}

function AiSummarySection({
  aiSummary,
  selectedAiProvider,
  onGenerateAiSummary,
  onGenerateAiSummaryWithProvider,
}: {
  aiSummary: AiSummaryState | null;
  selectedAiProvider: AiSummaryProvider | null;
  onGenerateAiSummary?: () => void;
  onGenerateAiSummaryWithProvider?: (provider: AiSummaryProvider) => void;
}) {
  if (!aiSummary) return null;

  return (
    <article className="markdown-card ai-summary-card">
      <div className="ai-summary-header">
        <div>
          <h3>AI 中文解读</h3>
          <p className="ai-summary-helper">点选你要使用的本机 CLI</p>
        </div>
        <div className="ai-provider-actions">
          {aiSummary.availableProviders.map((provider) => {
            const isSelected = (selectedAiProvider ?? aiSummary.provider) === provider;
            const isRunningCurrent = aiSummary.status === "running" && aiSummary.provider === provider;
            return (
              <button
                key={provider}
                className={`ai-provider-button ${isSelected ? "is-active" : ""}`}
                disabled={isRunningCurrent}
                onClick={() => onGenerateAiSummaryWithProvider?.(provider)}
                type="button"
              >
                {labelForProvider(provider)}
              </button>
            );
          })}
          {aiSummary.availableProviders.length === 0 && aiSummary.status !== "unavailable" ? (
            <button className="primary-button" disabled={aiSummary.status === "running"} onClick={() => onGenerateAiSummary?.()} type="button">
              {labelForSummaryAction(aiSummary.status)}
            </button>
          ) : null}
        </div>
      </div>

      {aiSummary.status === "unavailable" ? <p className="ai-summary-helper">未检测到支持的本机 CLI，可安装 Codex CLI 或 Claude Code 后再试。</p> : null}
      {aiSummary.status === "running" ? <p className="ai-summary-helper">正在后台生成中文摘要，完成后会自动刷新这里的内容。</p> : null}
      {aiSummary.status === "error" ? <p className="ai-summary-error">{aiSummary.error ?? "生成中文摘要失败。"}</p> : null}
      {aiSummary.status === "complete" && aiSummary.result ? (
        <div className="markdown-body ai-summary-body">
          <h3>{aiSummary.result.titleZh}</h3>
          <p>{aiSummary.result.summaryZh}</p>
          <ReactMarkdown>{aiSummary.result.translatedMarkdownZh}</ReactMarkdown>
        </div>
      ) : null}
      <button className="try-chat-button" type="button"><MessageCircle size={16} />在聊天中试用</button>
    </article>
  );
}

function shortPath(path: string): string {
  return path.replace(/^\/Users\/[^/]+/u, "~");
}

function deriveScenarioTags(skill: SkillBundle): string[] {
  const tags = new Set<string>();
  const text = [skill.name, skill.preview, ...skill.members.flatMap((member) => [member.name, member.preview])]
    .join(" ")
    .toLowerCase();

  if (text.includes("review") || text.includes("code")) tags.add("代码质量");
  if (text.includes("doc") || text.includes("write")) tags.add("文档写作");
  if (text.includes("test") || text.includes("verify")) tags.add("测试验证");
  if (text.includes("plan") || text.includes("brainstorm")) tags.add("流程规划");
  if (text.includes("deploy") || text.includes("release")) tags.add("发布部署");
  if (tags.size === 0) tags.add("通用效率");

  return [...tags];
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
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function labelForSummaryAction(status: AiSummaryState["status"]): string {
  switch (status) {
    case "idle": return "生成中文摘要";
    case "running": return "正在生成...";
    case "error": return "重新生成";
    case "unavailable": return "不可用";
    case "complete": return "已完成";
  }
}

function labelForProvider(provider: AiSummaryProvider): string {
  switch (provider) {
    case "codex": return "Codex";
    case "claude": return "Claude";
  }
}

function labelForSyncStatus(status: SkillBundle["syncStatus"]): string {
  switch (status) {
    case "unmanaged": return "来源包";
    case "idle": return "待配置";
    case "pending": return "待同步";
    case "synced": return "已同步";
    case "drifted": return "有漂移";
  }
}
