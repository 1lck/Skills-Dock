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

import type { AiSummaryProvider, AiSummaryState } from "../../lib/models/ai-summary";
import type { AggregatedInstalledSkill, AppKind } from "../../lib/models/skill";
import { AppLogo } from "../icons/app-logos";

interface SkillDetailProps {
  skill: AggregatedInstalledSkill | null;
  onOpenPath: (path: string) => void;
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
  onOpenPath,
  aiSummary = null,
  selectedAiProvider = null,
  onGenerateAiSummary,
  onGenerateAiSummaryWithProvider,
  onClose,
}: SkillDetailProps) {
  if (!skill) {
    return (
      <section aria-label="Skill Detail" className="detail-panel">
        <p className="empty-state">Select a skill to inspect its files and validation status.</p>
      </section>
    );
  }

  const installedAppCount = Object.values(skill.apps).filter(Boolean).length;
  const primary = skill.primaryInstallation;
  const Icon = iconForSkill(skill.name);

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
              <span># 代码审查</span>
              <span># 最佳实践</span>
              <span># 质量提升</span>
            </div>
          </div>
          <div className="detail-actions-main">
            <button className="primary-button" type="button"><Cloud size={17} />安装到应用</button>
            <button className="ghost-button" type="button"><XCircle size={17} />从应用移除</button>
            {primary ? <button className="ghost-button" onClick={() => onOpenPath(primary.skillPath)} type="button"><FolderOpen size={17} />打开文件夹</button> : null}
            <button className="ghost-button" type="button"><FileArchive size={17} />导出 ZIP</button>
            <button className="ghost-button icon-only" type="button"><MoreHorizontal size={17} /></button>
          </div>
        </div>
      </div>

      <nav className="detail-tabs" aria-label="详情标签">
        <button type="button">概览</button>
        <button className="is-active" type="button">SKILL.md</button>
        <button type="button">校验结果</button>
        <button type="button">安装位置</button>
        <button type="button">内容差异</button>
      </nav>

      <div className="detail-content-grid">
        <div className="detail-main-column">
          <article className="markdown-card">
            <div className="card-heading">
              <h3>SKILL.md 预览</h3>
              {primary ? <button className="ghost-button" onClick={() => onOpenPath(primary.skillFilePath)} type="button">在编辑器中打开 <ExternalLink size={14} /></button> : null}
            </div>
            <div className="markdown-body">
              <ReactMarkdown>{primary?.content || "暂无详细内容。"}</ReactMarkdown>
            </div>
          </article>

          <article className="diff-card">
            <div className="card-heading">
              <h3>内容差异（本地 Skill 与 Codex 已安装版本）</h3>
              <span className="change-badge">2 处更改</span>
            </div>
            <div className="diff-table" aria-label="内容差异预览">
              <p><span>12</span><del>- 支持多语言项目</del></p>
              <p><span>12</span><ins>+ 支持多语言项目和多语言混合代码</ins></p>
              <p><span>34</span><del>- timeout: 30</del></p>
              <p><span>35</span><ins>+ timeout: 45</ins></p>
              <p><span>36</span><del>- retries: 2</del></p>
              <p><span>37</span><ins>+ retries: 3</ins></p>
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
          <article className="meta-card">
            <h3>校验结果</h3>
            <ValidationRow label="文件完整性" ok />
            <ValidationRow label="YAML front matter" ok />
            <ValidationRow label="Schema 校验" ok />
            <ValidationRow label="引用文件检查" ok={skill.status === "valid"} warning={skill.status !== "valid"} />
            <button className="text-link" type="button">查看详情 ›</button>
          </article>

          <article className="meta-card">
            <h3>安装位置</h3>
            <div className="installations-list">
              {(Object.keys(appLabels) as AppKind[]).map((app) => {
                const installation = skill.installations.find((item) => item.toolKind === app);
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
            <h3>元数据</h3>
            <dl>
              <dt>版本</dt><dd>1.2.0</dd>
              <dt>作者</dt><dd>skill-dock</dd>
              <dt>更新时间</dt><dd>{formatUpdated(skill.updatedAt)}</dd>
              <dt>来源目录</dt><dd>{shortPath(primary?.sourcePath ?? skill.installations[0]?.sourcePath ?? "—")}</dd>
            </dl>
          </article>

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
