import type { AggregatedInstalledSkill } from "../../lib/models/skill";

interface SkillDetailProps {
  skill: AggregatedInstalledSkill | null;
  onOpenPath: (path: string) => void;
}

export function SkillDetailPanel({ skill, onOpenPath }: SkillDetailProps) {
  return (
    <section aria-label="Skill Detail" className="detail-panel">
      <div className="section-heading">
        <div>
          <h2>技能详情</h2>
          <p className="panel-subtitle">查看安装位置、校验状态与差异信息。</p>
        </div>
      </div>

      {!skill ? (
        <p className="empty-state">
          Select a skill to inspect its files and validation status.
        </p>
      ) : (
        <div className="detail-stack">
          <div className="detail-card">
            <div className="detail-header">
              <div>
                <h3>{skill.name}</h3>
                <p>{skill.preview}</p>
              </div>
              <span className={`badge status is-${skill.status}`}>{skill.status}</span>
            </div>
          </div>

          <div className="detail-card">
            <p className="muted-label">安装位置</p>
            <div className="installations-list">
              {skill.installations.map((installation) => (
                <div className="installation-row" key={installation.id}>
                  <div>
                    <strong>
                      {installation.toolKind} · {installation.status}
                    </strong>
                    <p>{installation.skillPath}</p>
                    <p>
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

          <div className="detail-card">
            <p className="muted-label">校验结果</p>
            {skill.primaryInstallation?.issues.length === 0 ? (
              <p className="ok-copy">结构完整，没有发现基础问题。</p>
            ) : (
              <ul className="issues-list">
                {(skill.primaryInstallation?.issues ?? []).map((issue) => (
                  <li key={issue.code}>
                    <strong>{issue.code}</strong>
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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
