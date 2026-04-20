import { MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

import type { AggregatedInstalledSkill } from "../../lib/models/skill";

interface SkillDetailProps {
  skill: AggregatedInstalledSkill | null;
  onOpenPath: (path: string) => void;
}

export function SkillDetailPanel({ skill, onOpenPath }: SkillDetailProps) {
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

            <div className="markdown-card">
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
            <button className="btn-try-chat" type="button">
              <MessageCircle size={16} strokeWidth={2.5} /> 在聊天中试用
            </button>
          </div>
        </>
      )}
    </section>
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

function labelForInstallationState(state: AggregatedInstalledSkill["installationState"]): string {
  switch (state) {
    case "ready":
      return "安装正常";
    case "attention":
      return "需要处理";
    case "conflict":
      return "内容冲突";
    case "linked":
      return "符号链接";
    case "external":
      return "外部来源";
  }
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
