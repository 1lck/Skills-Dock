import { MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

import type { AiSummaryProvider, AiSummaryState } from "../../lib/models/ai-summary";
import type { AggregatedInstalledSkill } from "../../lib/models/skill";

interface SkillDetailProps {
  skill: AggregatedInstalledSkill | null;
  onOpenPath: (path: string) => void;
  aiSummary?: AiSummaryState | null;
  selectedAiProvider?: AiSummaryProvider | null;
  onGenerateAiSummary?: () => void;
  onGenerateAiSummaryWithProvider?: (provider: AiSummaryProvider) => void;
}

export function SkillDetailPanel({
  skill,
  onOpenPath,
  aiSummary = null,
  selectedAiProvider = null,
  onGenerateAiSummary,
  onGenerateAiSummaryWithProvider,
}: SkillDetailProps) {
  return (
    <section aria-label="Skill Detail" className="detail-panel app-store-layout">
      {!skill ? (
        <p className="empty-state">
          Select a skill to inspect its files and validation status.
        </p>
      ) : (
        <>
          <div className="panel-scroll-content">
            <div className="app-store-header">
              <div className="app-icon-large">
                {/* Simulated icon gradient */}
              </div>
              <div className="app-title-row">
                <div className="app-title-group">
                  <h2>{skill.name}</h2>
                  <span className="app-type-label">Skill</span>
                </div>
                <div className="app-actions-group">
                  <button className="ios-toggle is-active is-blue" type="button" aria-label="Toggle Skill">
                    <span className="toggle-knob"></span>
                  </button>
                </div>
              </div>
              <p className="app-subtitle">{skill.preview}</p>
            </div>

            <AiSummarySection
              aiSummary={aiSummary}
              onGenerateAiSummary={onGenerateAiSummary}
              onGenerateAiSummaryWithProvider={onGenerateAiSummaryWithProvider}
              selectedAiProvider={selectedAiProvider}
            />

            <div className="markdown-card">
              <p className="muted-label" style={{ marginTop: 0 }}>原始 Markdown</p>
              <div className="markdown-body">
                <ReactMarkdown>
                  {skill.primaryInstallation?.content || "暂无详细内容。"}
                </ReactMarkdown>
              </div>
            </div>

            <div className="meta-card">
              <p className="muted-label" style={{ marginTop: 0 }}>安装位置</p>
              <div className="installations-list">
                {skill.installations.map((installation) => (
                  <div className="installation-row" key={installation.id}>
                    <div>
                      <strong>
                        {installation.toolKind} · {labelForValidation(installation.status)}
                      </strong>
                      <p>{installation.skillPath}</p>
                      <p>
                        {installation.pathKind === "symlink" ? "符号链接 · " : ""}
                        {shortHash(installation.contentHash)} ·{" "}
                        {compareWithPrimary(
                          skill.primaryInstallation?.contentHash ?? "",
                          installation.contentHash,
                        )}
                      </p>
                    </div>
                    <div className="detail-actions">
                      <button onClick={() => onOpenPath(installation.skillPath)} type="button">
                        打开目录
                      </button>
                      <button onClick={() => onOpenPath(installation.skillFilePath)} type="button">
                        打开文件
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="app-store-footer">
            <button className="btn-uninstall" type="button">卸载</button>
            <button
              className="btn-try-chat"
              type="button"
            >
              <MessageCircle size={16} strokeWidth={2.5} /> 在聊天中试用
            </button>
          </div>
        </>
      )}
    </section>
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
  if (!aiSummary) {
    return null;
  }

  return (
    <div className="markdown-card ai-summary-card">
      <div className="ai-summary-header">
        <div>
          <p className="muted-label" style={{ marginTop: 0 }}>AI 中文解读</p>
          <p className="ai-summary-helper">
            点选你要使用的本机 CLI
          </p>
        </div>
        <div className="ai-provider-actions">
          {aiSummary.availableProviders.map((provider) => {
            const isSelected = (selectedAiProvider ?? aiSummary.provider) === provider;
            const isRunningCurrent =
              aiSummary.status === "running" && aiSummary.provider === provider;
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
            <button
              className="btn-try-chat"
              disabled={aiSummary.status === "running"}
              onClick={() => onGenerateAiSummary?.()}
              type="button"
            >
              {labelForSummaryAction(aiSummary.status)}
            </button>
          ) : null}
        </div>
      </div>

      {aiSummary.status === "unavailable" ? (
        <p className="ai-summary-helper">
          未检测到支持的本机 CLI，可安装 Codex CLI 或 Claude Code 后再试。
        </p>
      ) : null}

      {aiSummary.status === "running" ? (
        <p className="ai-summary-helper">
          正在后台生成中文摘要，完成后会自动刷新这里的内容。
        </p>
      ) : null}

      {aiSummary.status === "error" ? (
        <p className="ai-summary-error">{aiSummary.error ?? "生成中文摘要失败。"}</p>
      ) : null}

      {aiSummary.status === "complete" && aiSummary.result ? (
        <div className="markdown-body ai-summary-body">
          <h3>{aiSummary.result.titleZh}</h3>
          <p>{aiSummary.result.summaryZh}</p>
          <ReactMarkdown>{aiSummary.result.translatedMarkdownZh}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}

function shortHash(value: string): string {
  return value.slice(0, 8);
}

function compareWithPrimary(primaryHash: string, nextHash: string): string {
  if (!primaryHash) {
    return "primary";
  }
  return primaryHash === nextHash ? "same content" : "different content";
}

function labelForValidation(status: AggregatedInstalledSkill["status"]): string {
  switch (status) {
    case "valid":
      return "校验正常";
    case "warning":
      return "校验警告";
    case "invalid":
      return "校验失败";
  }
}

function labelForSummaryAction(status: AiSummaryState["status"]): string {
  switch (status) {
    case "idle":
      return "生成中文摘要";
    case "running":
      return "正在生成...";
    case "error":
      return "重新生成";
    case "unavailable":
      return "不可用";
    case "complete":
      return "已完成";
  }
}

function labelForProvider(provider: AiSummaryProvider): string {
  switch (provider) {
    case "codex":
      return "Codex";
    case "claude":
      return "Claude";
  }
}
