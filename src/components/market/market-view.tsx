import {
  Box,
  Check,
  ExternalLink,
  Globe,
  Link2,
  Lock,
  Search,
  ShieldCheck,
} from "lucide-react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";

import { marketCategoryLabels } from "../../lib/application/market-packages";
import type {
  MarketCategory,
  MarketPackage,
  MarketPackageRemoteSnapshot,
} from "../../lib/models/market";
import type { AppKind } from "../../lib/models/skill";

interface MarketViewProps {
  installedApps: Record<string, boolean>;
  installBusyPackageId: string | null;
  isDemoMode: boolean;
  onInstallPackage: (pkg: MarketPackage, targetApp: AppKind) => void;
  packages: MarketPackage[];
}

const categoryOrder: MarketCategory[] = [
  "coding",
  "productivity",
  "data",
  "design",
  "automation",
  "docs",
  "research",
  "operations",
];

export function MarketView({
  installedApps,
  installBusyPackageId,
  isDemoMode,
  onInstallPackage,
  packages,
}: MarketViewProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | "all">("all");
  const [detailPackageId, setDetailPackageId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [remoteSnapshots, setRemoteSnapshots] = useState<
    Record<string, MarketPackageRemoteSnapshot>
  >({});
  const [remoteLoadingPackageId, setRemoteLoadingPackageId] = useState<string | null>(null);

  const filteredPackages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return packages.filter((entry) => {
      if (
        selectedCategory !== "all" &&
        entry.primaryCategory !== selectedCategory
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        entry.name,
        entry.summary,
        entry.publisher.name,
        ...entry.members.map((member) => `${member.name} ${member.summary}`),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [packages, query, selectedCategory]);

  const groupedPackages = categoryOrder
    .map((category) => ({
      category,
      items: filteredPackages.filter((entry) => entry.primaryCategory === category),
    }))
    .filter((group) => group.items.length > 0);

  const detailPackage =
    packages.find((entry) => entry.id === detailPackageId) ?? null;
  const detailPackageInstallableCount =
    detailPackage?.members.filter((member) => member.skillhubSlug).length ?? 0;
  const detailRemoteSnapshot = detailPackage
    ? remoteSnapshots[detailPackage.id] ?? null
    : null;
  const hasDetailLinks = detailPackage
    ? Object.values(detailPackage.links).some((value) => Boolean(value))
    : false;
  const installTargets: Array<{ key: AppKind; label: string }> = [
    { key: "codex", label: "Codex" },
    { key: "claude", label: "Claude" },
    { key: "gemini", label: "Gemini" },
    { key: "opencode", label: "OpenCode" },
  ];

  useEffect(() => {
    if (!detailPackageId) {
      setPickerOpen(false);
    }
  }, [detailPackageId]);

  useEffect(() => {
    if (!detailPackage || isDemoMode || !isTauri()) {
      return;
    }

    if (remoteSnapshots[detailPackage.id] || remoteLoadingPackageId === detailPackage.id) {
      return;
    }

    const skills = detailPackage.members
      .filter((member) => member.skillhubSlug)
      .map((member) => ({
        slug: member.skillhubSlug ?? member.id,
        skillId: member.skillhubSlug ?? member.id,
      }));

    if (skills.length === 0) {
      return;
    }

    setRemoteLoadingPackageId(detailPackage.id);
    void invoke<MarketPackageRemoteSnapshot>("get_market_package_snapshot", {
      request: {
        packageId: detailPackage.id,
        skills,
      },
    })
      .then((snapshot) => {
        setRemoteSnapshots((current) => ({
          ...current,
          [snapshot.packageId]: snapshot,
        }));
      })
      .catch((error) => {
        console.warn("Failed to fetch market package snapshot:", error);
      })
      .finally(() => {
        setRemoteLoadingPackageId((current) =>
          current === detailPackage.id ? null : current,
        );
      });
  }, [detailPackage, isDemoMode, remoteLoadingPackageId, remoteSnapshots]);

  return (
    <div className="market-page">
      <section className="market-overview-band" aria-label="市场概览">
        <div className="market-overview-stats">
          <Metric label="能力包" value={packages.length} />
          <Metric
            label="成员"
            value={packages.reduce((sum, entry) => sum + entry.members.length, 0)}
          />
          <Metric
            label="已装齐"
            value={
              packages.filter((entry) => entry.installState === "installed").length
            }
          />
        </div>
      </section>

      <div className="market-controls">
        <label className="search-box" htmlFor="market-package-search">
          <Search size={18} />
          <input
            id="market-package-search"
            aria-label="搜索市场包"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="搜索能力包、发布方或成员..."
            value={query}
          />
        </label>

        <div className="market-category-pills" role="tablist" aria-label="市场分类">
          <button
            className={
              selectedCategory === "all" ? "category-pill is-active" : "category-pill"
            }
            onClick={() => setSelectedCategory("all")}
            type="button"
          >
            全部
          </button>
          {categoryOrder.map((category) => (
            <button
              key={category}
              className={
                selectedCategory === category
                  ? "category-pill is-active"
                  : "category-pill"
              }
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {marketCategoryLabels[category]}
            </button>
          ))}
        </div>
      </div>

      <div className="market-directory">
        {groupedPackages.length > 0 ? (
          groupedPackages.map((group) => (
            <section
              key={group.category}
              className="market-section"
              aria-label={marketCategoryLabels[group.category]}
            >
              <div className="market-section-heading">
                <div>
                  <h3>{marketCategoryLabels[group.category]}</h3>
                  <p>{group.items.length} 个包</p>
                </div>
              </div>

              <div className="market-package-grid">
                {group.items.map((entry) => (
                  <article key={entry.id} className="market-package-row">
                    <span
                      className="market-package-icon"
                      style={{
                        background: entry.icon.surface,
                        color: entry.icon.foreground ?? entry.icon.accent,
                        borderColor: `${entry.icon.accent}22`,
                      }}
                    >
                      {entry.icon.monogram}
                    </span>
                    <span className="market-package-copy">
                      <strong>{entry.name}</strong>
                      <small>{entry.summary}</small>
                      <em>
                        {entry.publisher.name} · {entry.members.length} 个成员
                      </em>
                    </span>
                    <div className="market-package-actions">
                      <span className={`market-install-chip is-${entry.installState}`}>
                        {installLabel(entry.installState)}
                      </span>
                      <button
                        aria-label={`查看 ${entry.name} 详情`}
                        className="ghost-button"
                        onClick={() => setDetailPackageId(entry.id)}
                        type="button"
                      >
                        详情
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <section className="market-empty-state" aria-label="市场空状态">
            <Box size={22} />
            <div>
              <strong>没有匹配的 package</strong>
              <p>先放宽搜索词，或者切回全部分类看人工维护的市场包。</p>
            </div>
          </section>
        )}
      </div>

      {detailPackage ? (
        <div
          className="modal-overlay"
          onClick={() => {
            setPickerOpen(false);
            setDetailPackageId(null);
          }}
        >
          <div
            className="modal-content market-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="关闭市场详情"
              className="modal-close-btn"
              onClick={() => setDetailPackageId(null)}
              type="button"
            >
              ×
            </button>
            <div className="market-detail-panel">
              <header className="market-detail-hero">
                <span
                  className="market-package-icon is-large"
                  style={{
                    background: detailPackage.icon.surface,
                    color:
                      detailPackage.icon.foreground ?? detailPackage.icon.accent,
                    borderColor: `${detailPackage.icon.accent}22`,
                  }}
                >
                  {detailPackage.icon.monogram}
                </span>
                  <div>
                    <div className="market-detail-meta">
                      <span>{marketCategoryLabels[detailPackage.primaryCategory]}</span>
                      <span>{detailPackage.publisher.name}</span>
                      <span>{detailPackage.members.length} 个成员</span>
                    </div>
                    <h2>{detailPackage.name}</h2>
                    <p>{detailPackage.description}</p>
                  </div>
              </header>

              <div className="market-detail-layout">
                <div className="market-detail-main">
                  <section className="market-detail-card market-detail-section">
                    <h3>适用场景</h3>
                    <div className="market-prompt-strip" aria-label="示例提示">
                      {detailPackage.prompts.map((prompt) => (
                        <div key={prompt}>{prompt}</div>
                      ))}
                    </div>
                  </section>

                  <section className="market-detail-card market-detail-section">
                    <div className="market-section-split">
                      <h3>包含内容</h3>
                      <span>
                        {detailPackage.installedMemberCount}/{detailPackage.members.length} 已命中本机安装
                      </span>
                    </div>
                    <div className="market-member-list">
                      {detailPackage.members.map((member) => (
                        <div key={member.id} className="market-member-row">
                          <span
                            className={
                              member.installed
                                ? "market-member-status is-installed"
                                : "market-member-status"
                            }
                          >
                            {member.installed ? <Check size={14} /> : "·"}
                          </span>
                          <div>
                            <strong>{member.name}</strong>
                            <p>{member.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {detailRemoteSnapshot ? (
                    <section className="market-detail-card market-detail-section">
                      <h3>远程成员</h3>
                      <div className="market-remote-list">
                        {detailRemoteSnapshot.members.map((member) => (
                          <div key={member.slug} className="market-remote-row">
                            <strong>{member.slug}</strong>
                            <span>v{member.version}</span>
                            <small>
                              {member.ownerName ?? "未知作者"} ·{" "}
                              {formatCompactNumber(member.downloads)} 下载 ·{" "}
                              {formatCompactNumber(member.installs)} 安装
                            </small>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>

                <aside className="market-detail-side">
                  <section className="market-detail-card market-detail-action-card">
                    <div className="market-detail-action-copy">
                      <span className={`market-install-chip is-${detailPackage.installState}`}>
                        {installLabel(detailPackage.installState)}
                      </span>
                      <strong>
                        {detailPackageInstallableCount > 0
                          ? `可导入 ${detailPackageInstallableCount} 个远程成员`
                          : "暂未提供可导入成员"}
                      </strong>
                      <p>
                        {isDemoMode
                          ? "当前是浏览器预览，只展示结构。"
                          : detailPackageInstallableCount > 0
                            ? "导入后会进入本地库，再参与常规扫描和管理。"
                            : "这个 package 还没有配置远程下载源。"}
                      </p>
                    </div>
                    <button
                      className="primary-button market-install-button"
                      disabled={
                        isDemoMode ||
                        !detailPackage ||
                        detailPackageInstallableCount === 0 ||
                        installBusyPackageId !== null
                      }
                      onClick={() => setPickerOpen(true)}
                      type="button"
                    >
                      {installBusyPackageId === detailPackage?.id
                        ? "导入中..."
                        : "选择安装位置"}
                    </button>
                  </section>

                  <section className="market-detail-card">
                    <h3>概览</h3>
                    <div className="market-detail-stat-grid">
                      <div className="market-detail-stat">
                        <strong>{detailPackage.members.length}</strong>
                        <span>成员</span>
                      </div>
                      <div className="market-detail-stat">
                        <strong>{detailPackageInstallableCount}</strong>
                        <span>可导入</span>
                      </div>
                      <div className="market-detail-stat">
                        <strong>
                          {detailRemoteSnapshot
                            ? formatCompactNumber(detailRemoteSnapshot.totalDownloads)
                            : "—"}
                        </strong>
                        <span>下载</span>
                      </div>
                      <div className="market-detail-stat">
                        <strong>
                          {detailRemoteSnapshot
                            ? formatCompactNumber(detailRemoteSnapshot.totalInstalls)
                            : "—"}
                        </strong>
                        <span>安装</span>
                      </div>
                    </div>
                    <dl className="market-info-list">
                      <div>
                        <dt>发布方</dt>
                        <dd>{detailPackage.publisher.name}</dd>
                      </div>
                      <div>
                        <dt>类型</dt>
                        <dd>{publisherLabel(detailPackage.publisher.type)}</dd>
                      </div>
                      <div>
                        <dt>远程成员</dt>
                        <dd>
                          {detailRemoteSnapshot
                            ? `${detailRemoteSnapshot.memberCount} 个`
                            : remoteLoadingPackageId === detailPackage.id
                              ? "加载中..."
                              : isDemoMode
                                ? "预览模式"
                                : "待加载"}
                        </dd>
                      </div>
                      <div>
                        <dt>最近更新</dt>
                        <dd>{formatUpdatedAt(detailRemoteSnapshot?.lastUpdatedAt ?? null)}</dd>
                      </div>
                    </dl>
                  </section>

                  {hasDetailLinks ? (
                    <section className="market-detail-card">
                      <h3>链接</h3>
                      <div className="market-link-list">
                        {detailPackage.links.website ? (
                          <a href={detailPackage.links.website} rel="noreferrer" target="_blank">
                            <Globe size={14} />
                            官网
                          </a>
                        ) : null}
                        {detailPackage.links.docs ? (
                          <a href={detailPackage.links.docs} rel="noreferrer" target="_blank">
                            <Link2 size={14} />
                            文档
                          </a>
                        ) : null}
                        {detailPackage.links.source ? (
                          <a href={detailPackage.links.source} rel="noreferrer" target="_blank">
                            <ExternalLink size={14} />
                            来源
                          </a>
                        ) : null}
                        {detailPackage.links.privacy ? (
                          <a href={detailPackage.links.privacy} rel="noreferrer" target="_blank">
                            <ShieldCheck size={14} />
                            隐私
                          </a>
                        ) : null}
                        {detailPackage.links.policy ? (
                          <a href={detailPackage.links.policy} rel="noreferrer" target="_blank">
                            <Lock size={14} />
                            政策
                          </a>
                        ) : null}
                      </div>
                    </section>
                  ) : null}
                </aside>
              </div>
            </div>

            {pickerOpen && detailPackage ? (
              <div
                className="market-target-picker-overlay"
                onClick={() => setPickerOpen(false)}
              >
                <div
                  className="market-target-picker"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="market-target-picker-header">
                    <h3>安装到哪个 AI 工具？</h3>
                    <p>{detailPackage.name} 会先下载到本地库，再安装到目标目录。</p>
                  </div>
                  <div className="market-target-picker-list">
                    {installTargets.map((target) => (
                      <button
                        key={target.key}
                        className="market-target-button"
                        disabled={!installedApps[target.key] || installBusyPackageId !== null}
                        onClick={() => {
                          onInstallPackage(detailPackage, target.key);
                          setPickerOpen(false);
                        }}
                        type="button"
                      >
                        <strong>{target.label}</strong>
                        <span>
                          {installedApps[target.key] ? "安装到对应 skills 目录" : "未检测到本机环境"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="market-overview-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function installLabel(state: MarketPackage["installState"]): string {
  switch (state) {
    case "catalog":
      return "仅展示";
    case "installed":
      return "已装齐";
    case "partial":
      return "已装部分";
    case "available":
    default:
      return "可安装";
  }
}

function publisherLabel(type: MarketPackage["publisher"]["type"]): string {
  switch (type) {
    case "official":
      return "官方维护";
    case "mirror":
      return "镜像来源";
    case "community":
    default:
      return "社区维护";
  }
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatUpdatedAt(value: number | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
