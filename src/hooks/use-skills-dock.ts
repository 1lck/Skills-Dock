import { message, open, save } from "@tauri-apps/plugin-dialog";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import {
  aggregateInstalledSkills,
  countInstalledApps,
} from "../lib/application/skills-catalog";
import type { MarketPackage } from "../lib/models/market";
import {
  getSourceIdsForToolKinds,
  mergePartialSnapshot,
} from "../lib/application/skills-refresh";
import { aggregateSkillBundles } from "../lib/application/skill-bundles";
import { buildDemoSnapshot } from "../lib/fixtures/demo-snapshot";
import type {
  AiSummaryProvider,
  AiSummaryRequest,
  AiSummaryState,
} from "../lib/models/ai-summary";
import type {
  AppKind,
  InstallationState,
  SkillBundle,
  SkillDetail,
  SkillSnapshot,
  SourceInput,
  SourceRecord,
  ToolKind,
} from "../lib/models/skill";
import { makeSourceId } from "../lib/models/skill";
import {
  addCustomSource,
  emptyDesiredApps,
  createCustomBundleDefinition,
  loadCustomSources,
  loadCustomBundles,
  loadSourceOverrides,
  saveCustomBundles,
  saveCustomSources,
  saveSourceOverrides,
  type SourceOverrides,
  type StorageLike,
} from "../lib/storage/custom-sources";
import type { SkillUsageMap } from "../lib/storage/skill-usage";

interface ImportSkillsZipResult {
  targetRoot: string;
  importedSkillPaths: string[];
}

interface ExportSkillsZipResult {
  outputPath: string;
  exportedSkillCount: number;
}

interface InstallMarketPackageResult {
  targetRoot: string;
  installedSkillPaths: string[];
}

interface RefreshOptions {
  customRootsOverride?: string[];
  sourceIds?: string[];
  includeUsage?: boolean;
}

function isTauriRuntime(): boolean {
  return isTauri();
}

function getStorage(): StorageLike {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return {
    getItem() {
      return null;
    },
    setItem() {},
  };
}

function toSourceInput(source: SourceRecord): SourceInput {
  return {
    id: source.id,
    name: source.name,
    toolKind: source.toolKind,
    sourceType: source.sourceType,
    rootPath: source.rootPath,
  };
}

function applySourceOverrides(
  sources: SourceRecord[],
  overrides: SourceOverrides,
): SourceRecord[] {
  return sources.map((source) => {
    if (source.sourceType !== "builtin" || source.toolKind === "generic") {
      return source;
    }

    const overridePath = overrides[source.toolKind];
    if (!overridePath || overridePath === source.rootPath) {
      return source;
    }

    return {
      ...source,
      id: makeSourceId(source.toolKind, overridePath),
      rootPath: overridePath,
      lastIndexedAt: null,
    };
  });
}

export function useSkillsDock() {
  const demoMode = !isTauriRuntime();
  const storage = getStorage();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [allSkills, setAllSkills] = useState<SkillDetail[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState<string | "all">("all");
  const [selectedInstallationState, setSelectedInstallationState] =
    useState<InstallationState | "all">("all");
  const [selectedToolKind, setSelectedToolKind] = useState<ToolKind | "all">("all");
  const [batchBusy, setBatchBusy] = useState(false);
  const [marketInstallBusyPackageId, setMarketInstallBusyPackageId] =
    useState<string | null>(null);
  const [usageMap, setUsageMap] = useState<SkillUsageMap>({});
  const [installedApps, setInstalledApps] = useState<Record<string, boolean>>({});
  const [selectedSkillAiSummary, setSelectedSkillAiSummary] = useState<AiSummaryState | null>(null);
  const [selectedAiProvider, setSelectedAiProvider] = useState<AiSummaryProvider | null>(null);
  const [customBundles, setCustomBundles] = useState(() =>
    loadCustomBundles(storage),
  );

  function persistCustomBundles(nextBundles: ReturnType<typeof loadCustomBundles>) {
    saveCustomBundles(storage, nextBundles);
    setCustomBundles(nextBundles);
  }

  async function refreshUsage() {
    if (demoMode) {
      return;
    }

    const scanned = await invoke<SkillUsageMap>("scan_skill_usage");
    setUsageMap(scanned);
  }

  async function refresh(options: RefreshOptions = {}) {
    setLoading(true);
    const customRoots = options.customRootsOverride ?? loadCustomSources(storage);

    let snapshot: SkillSnapshot;
    if (!demoMode) {
      const resolvedSources = await invoke<SourceRecord[]>("load_sources", {
        customRoots,
      });
      const sourcesToScan = applySourceOverrides(
        resolvedSources,
        loadSourceOverrides(storage),
      );
      const scanTargets = options.sourceIds?.length
        ? sourcesToScan.filter((source) => options.sourceIds?.includes(source.id))
        : sourcesToScan;

      snapshot = await invoke<SkillSnapshot>("scan_sources", {
        sources: scanTargets.map(toSourceInput),
      });
      
      const appsInstalled = await invoke<Record<string, boolean>>("get_installed_apps");
      setInstalledApps(appsInstalled);
    } else {
      snapshot = buildDemoSnapshot(customRoots);
      setInstalledApps({ codex: true, claude: true, gemini: true, opencode: true });
    }

    if (!demoMode && options.sourceIds?.length) {
      const merged = mergePartialSnapshot(sources, allSkills, snapshot);
      setSources(merged.sources);
      setAllSkills(merged.skills);
    } else {
      setSources(snapshot.sources);
      setAllSkills(snapshot.skills);
    }

    // 使用记录扫描改为按需触发，避免安装/同步动作带来高 CPU 开销
    if (!demoMode && options.includeUsage === true) {
      const scanned = await invoke<SkillUsageMap>("scan_skill_usage");
      setUsageMap(scanned);
    }

    setLoading(false);
  }

  useEffect(() => {
    void refresh({ includeUsage: false });
  }, []);

  const aggregatedSkills = aggregateInstalledSkills(allSkills);
  const aggregatedBundles = aggregateSkillBundles(
    aggregatedSkills,
    sources,
    usageMap,
    customBundles,
  );
  const appCounts = countInstalledApps(aggregatedSkills);
  const sourcesById = new Map(sources.map((source) => [source.id, source]));

  const filteredSkills = aggregatedBundles.filter((skill) => {
    if (
      selectedInstallationState !== "all" &&
      skill.installationState !== selectedInstallationState
    ) {
      return false;
    }

    if (
      selectedToolKind !== "all" &&
      !skill.members.some((member) =>
        member.installations.some(
          (installation) => installation.toolKind === selectedToolKind,
        ),
      )
    ) {
      return false;
    }

    if (
      selectedSourceId !== "all" &&
      !skill.members.some((member) =>
        member.installations.some(
          (installation) => installation.sourceId === selectedSourceId,
        ),
      )
    ) {
      return false;
    }

    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [
      skill.name,
      skill.preview,
      ...skill.members.flatMap((member) => [
        member.name,
        member.preview,
        ...member.installations.flatMap((installation) => [
          sourcesById.get(installation.sourceId)?.name ?? "",
          installation.skillPath,
        ]),
      ]),
    ].some((value) => value.toLowerCase().includes(query));
  });
  const sortedSkills = filteredSkills;
  const selectedSkill =
    sortedSkills.find((skill) => skill.id === selectedSkillId) ?? null;
  const selectedSkillSummaryRequest = selectedSkill
    ? toAiSummaryRequest(selectedSkill, selectedAiProvider)
    : null;
  const availableMemberSkills = aggregatedSkills
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));

  useEffect(() => {
    if (sortedSkills.length === 0) {
      setSelectedSkillId(null);
      return;
    }

    if (selectedSkillId && !sortedSkills.some((skill) => skill.id === selectedSkillId)) {
      setSelectedSkillId(null);
    }
  }, [selectedSkillId, sortedSkills]);

  useEffect(() => {
    const visibleIds = new Set(sortedSkills.map((skill) => skill.id));
    setSelectedSkillIds((current) => current.filter((skillId) => visibleIds.has(skillId)));
  }, [sortedSkills]);

  useEffect(() => {
    if (!selectedSkillSummaryRequest || demoMode) {
      setSelectedSkillAiSummary(null);
      setSelectedAiProvider(null);
      return;
    }

    let cancelled = false;

    async function loadSummary() {
      const snapshot = await invoke<AiSummaryState>("get_skill_ai_summary", {
        request: selectedSkillSummaryRequest,
      });
      if (!cancelled) {
        setSelectedAiProvider((current) => current ?? snapshot.provider ?? snapshot.availableProviders[0] ?? null);
        setSelectedSkillAiSummary(snapshot);
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [
    demoMode,
    selectedSkillSummaryRequest?.contentHash,
    selectedSkillSummaryRequest?.content,
    selectedSkillSummaryRequest?.skillName,
  ]);

  useEffect(() => {
    if (demoMode || !selectedSkillSummaryRequest || selectedSkillAiSummary?.status !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      void invoke<AiSummaryState>("get_skill_ai_summary", {
        request: selectedSkillSummaryRequest,
      }).then((snapshot) => {
        setSelectedSkillAiSummary(snapshot);
      });
    }, 1500);

    return () => window.clearInterval(interval);
  }, [
    demoMode,
    selectedSkillAiSummary?.status,
    selectedSkillSummaryRequest?.contentHash,
    selectedSkillSummaryRequest?.content,
    selectedSkillSummaryRequest?.skillName,
  ]);

  async function addFolder() {
    if (demoMode) {
      return;
    }

    const selected = await open({
      directory: true,
      multiple: false,
      title: "选择 Skills 目录",
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    const nextRoots = addCustomSource(loadCustomSources(storage), selected);
    saveCustomSources(storage, nextRoots);
    await refresh({ customRootsOverride: nextRoots });
  }

  async function importFromZip() {
    if (demoMode) {
      return;
    }

    const selectedZip = await open({
      directory: false,
      multiple: false,
      filters: [{ name: "ZIP", extensions: ["zip"] }],
      title: "选择 Skills ZIP 包",
    });

    if (!selectedZip || Array.isArray(selectedZip)) {
      return;
    }

    const selectedTarget = await open({
      directory: true,
      multiple: false,
      title: "选择导入目标目录",
    });

    if (!selectedTarget || Array.isArray(selectedTarget)) {
      return;
    }

    try {
      const result = await invoke<ImportSkillsZipResult>("import_skills_zip", {
        request: {
          zipPath: selectedZip,
          targetRoot: selectedTarget,
        },
      });

      const nextRoots = addCustomSource(loadCustomSources(storage), selectedTarget);
      saveCustomSources(storage, nextRoots);
      await refresh({ customRootsOverride: nextRoots });
      await message(
        `已导入 ${result.importedSkillPaths.length} 个 Skills 到：\n${result.targetRoot}`,
        {
          title: "导入完成",
          kind: "info",
        },
      );
    } catch (error) {
      await message(`ZIP 导入失败：${describeError(error)}`, {
        title: "导入失败",
        kind: "error",
      });
    }
  }

  async function openPath(path: string) {
    if (demoMode) {
      return;
    }

    await invoke("open_path", { path });
  }

  async function browseSource(source: SourceRecord, log = false) {
    if (demoMode) {
      return;
    }

    if (log) {
      await openPath(source.rootPath.replace(/[/\\]skills$/u, "/logs"));
      return;
    }

    if (source.toolKind === "generic") {
      await openPath(source.rootPath);
      return;
    }

    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: source.rootPath,
      title: `选择 ${source.name} 目录`,
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    const overrides = {
      ...loadSourceOverrides(storage),
      [source.toolKind]: selected,
    };
    saveSourceOverrides(storage, overrides);
    await refresh();
  }


  async function toggleApp(skillId: string, app: AppKind, enabled: boolean) {
    const bundle = sortedSkills.find((entry) => entry.id === skillId);
    if (!bundle) {
      return;
    }

    if (demoMode) {
      return;
    }

    const requests = bundle.members
      .map((member) => {
        const sourceSkillPath =
          member.primaryInstallation?.skillPath ??
          member.installations[0]?.skillPath;

        if (!sourceSkillPath) {
          return null;
        }

        return {
          skillId: member.canonicalId,
          sourceSkillPath,
          targetApp: app,
          enabled,
        };
      })
      .filter((request): request is NonNullable<typeof request> => request !== null);

    if (requests.length === 0) {
      return;
    }

    if (requests.length === 1) {
      await invoke("toggle_app_install", { request: requests[0] });
    } else {
      await invoke("toggle_app_installs", { requests });
    }
    await refresh({
      sourceIds: getSourceIdsForToolKinds(sources, [app]),
      includeUsage: false,
    });
  }

  async function exportSelectedSkills() {
    if (demoMode || selectedSkillIds.length === 0) {
      return;
    }

    const skills = sortedSkills
      .filter((skill) => selectedSkillIds.includes(skill.id))
      .flatMap((bundle) =>
        bundle.members.map((member) => {
          const sourceSkillPath =
            member.primaryInstallation?.skillPath ??
            member.installations[0]?.skillPath;

          if (!sourceSkillPath) {
            return null;
          }

          return {
            skillId: member.canonicalId,
            sourceSkillPath,
          };
        }),
      )
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    if (skills.length === 0) {
      return;
    }

    const suggestedName =
      skills.length === 1
        ? `${skills[0].skillId}.zip`
        : `skills-dock-export-${skills.length}.zip`;
    const selectedOutput = await save({
      title: "导出 Skills ZIP",
      defaultPath: suggestedName,
      filters: [{ name: "ZIP", extensions: ["zip"] }],
    });

    if (!selectedOutput) {
      return;
    }

    const outputPath = selectedOutput.toLowerCase().endsWith(".zip")
      ? selectedOutput
      : `${selectedOutput}.zip`;
    try {
      const result = await invoke<ExportSkillsZipResult>("export_skills_zip", {
        request: {
          outputPath,
          skills,
        },
      });
      await message(
        `已导出 ${result.exportedSkillCount} 个 Skills 到：\n${result.outputPath}`,
        {
          title: "导出完成",
          kind: "info",
        },
      );
    } catch (error) {
      await message(`ZIP 导出失败：${describeError(error)}`, {
        title: "导出失败",
        kind: "error",
      });
    }
  }

  function appLabel(app: AppKind): string {
    switch (app) {
      case "codex":
        return "Codex";
      case "claude":
        return "Claude";
      case "gemini":
        return "Gemini";
      case "opencode":
        return "OpenCode";
    }
  }

  async function installMarketPackage(pkg: MarketPackage, targetApp: AppKind) {
    if (demoMode || marketInstallBusyPackageId) {
      return;
    }

    const skills = pkg.members
      .filter((member) => member.skillhubSlug)
      .map((member) => ({
        slug: member.skillhubSlug ?? member.id,
        skillId: member.skillhubSlug ?? member.id,
      }));

    if (skills.length === 0) {
      await message("这个 package 还没有配置可下载成员。", {
        title: "暂不可安装",
        kind: "warning",
      });
      return;
    }

    setMarketInstallBusyPackageId(pkg.id);
    try {
      const result = await invoke<InstallMarketPackageResult>("install_market_package", {
        request: {
          packageId: pkg.id,
          packageName: pkg.name,
          skills,
        },
      });

      const nextRoots = addCustomSource(loadCustomSources(storage), result.targetRoot);
      saveCustomSources(storage, nextRoots);

      const requests = result.installedSkillPaths.map((sourceSkillPath, index) => ({
        skillId: skills[index]?.skillId ?? pkg.members[index]?.id ?? `market-skill-${index}`,
        sourceSkillPath,
        targetApp,
        enabled: true,
      }));

      if (requests.length === 1) {
        await invoke("toggle_app_install", { request: requests[0] });
      } else if (requests.length > 1) {
        await invoke("toggle_app_installs", { requests });
      }

      await refresh({ customRootsOverride: nextRoots, includeUsage: false });

      await message(
        `已下载 ${result.installedSkillPaths.length} 个成员，并安装到 ${appLabel(targetApp)}。`,
        {
          title: `${pkg.name} 已安装`,
          kind: "info",
        },
      );
    } catch (error) {
      await message(`市场安装失败：${describeError(error)}`, {
        title: "安装失败",
        kind: "error",
      });
    } finally {
      setMarketInstallBusyPackageId(null);
    }
  }

  async function generateAiSummary() {
    if (demoMode || !selectedSkillSummaryRequest) {
      return;
    }

    const snapshot = await invoke<AiSummaryState>("enqueue_skill_ai_summary", {
      request: selectedSkillSummaryRequest,
    });
    setSelectedAiProvider(snapshot.provider);
    setSelectedSkillAiSummary(snapshot);
  }

  async function generateAiSummaryWithProvider(provider: AiSummaryProvider) {
    setSelectedAiProvider(provider);
    if (demoMode || !selectedSkill) {
      return;
    }

    const request = toAiSummaryRequest(selectedSkill, provider);
    const snapshot = await invoke<AiSummaryState>("enqueue_skill_ai_summary", {
      request,
    });
    setSelectedAiProvider(snapshot.provider);
    setSelectedSkillAiSummary(snapshot);
  }

  function toggleSkillSelection(skillId: string) {
    setSelectedSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((entry) => entry !== skillId)
        : [...current, skillId],
    );
  }

  function toggleSelectAllVisible() {
    if (
      filteredSkills.length > 0 &&
      filteredSkills.every((skill) => selectedSkillIds.includes(skill.id))
    ) {
      setSelectedSkillIds([]);
      return;
    }

    setSelectedSkillIds(filteredSkills.map((skill) => skill.id));
  }

  function createLocalBundle() {
    const selectedBundles = sortedSkills.filter((skill) =>
      selectedSkillIds.includes(skill.id),
    );
    if (selectedBundles.length === 0) {
      return;
    }

    const memberSkillIds = [...new Set(
      selectedBundles.flatMap((bundle) =>
        bundle.members.map((member) => member.canonicalId),
      ),
    )];
    if (memberSkillIds.length === 0) {
      return;
    }

    const nextBundle = createCustomBundleDefinition(
      `My Bundle ${customBundles.length + 1}`,
      memberSkillIds,
    );
    const nextBundles = [...customBundles, nextBundle];
    persistCustomBundles(nextBundles);
    setSelectedSkillId(nextBundle.id);
    setSelectedSkillIds([nextBundle.id]);
  }

  function renameLocalBundle(bundleId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    persistCustomBundles(
      customBundles.map((bundle) =>
        bundle.id === bundleId
          ? { ...bundle, name: trimmed, updatedAt: new Date().toISOString() }
          : bundle,
      ),
    );
  }

  function deleteLocalBundle(bundleId: string) {
    persistCustomBundles(customBundles.filter((bundle) => bundle.id !== bundleId));
    if (selectedSkillId === bundleId) {
      setSelectedSkillId(null);
    }
    setSelectedSkillIds((current) => current.filter((id) => id !== bundleId));
  }

  function toggleBundleMember(bundleId: string, memberId: string) {
    persistCustomBundles(
      customBundles.map((bundle) => {
        if (bundle.id !== bundleId) {
          return bundle;
        }

        const nextMemberIds = bundle.memberSkillIds.includes(memberId)
          ? bundle.memberSkillIds.filter((id) => id !== memberId)
          : [...bundle.memberSkillIds, memberId];

        if (nextMemberIds.length === 0) {
          return bundle;
        }

        return {
          ...bundle,
          memberSkillIds: nextMemberIds,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function setBundleDesiredApp(bundleId: string, app: AppKind, enabled: boolean) {
    persistCustomBundles(
      customBundles.map((bundle) =>
        bundle.id === bundleId
          ? {
              ...bundle,
              desiredApps: {
                ...(bundle.desiredApps ?? emptyDesiredApps()),
                [app]: enabled,
              },
              updatedAt: new Date().toISOString(),
            }
          : bundle,
      ),
    );
  }

  async function syncBundle(bundleId: string) {
    const bundle = sortedSkills.find((entry) => entry.id === bundleId);
    const bundleState = customBundles.find((entry) => entry.id === bundleId);
    if (!bundle || !bundleState) {
      return;
    }

    const requests = Object.entries(bundleState.desiredApps)
      .flatMap(([app, enabled]) => {
        if (!enabled) {
          return [];
        }

        return bundle.members.flatMap((member) => {
          if (member.apps[app as AppKind]) {
            return [];
          }

          const sourceSkillPath =
            member.primaryInstallation?.skillPath ??
            member.installations[0]?.skillPath;
          if (!sourceSkillPath) {
            return [];
          }

          return [
            {
              skillId: member.canonicalId,
              sourceSkillPath,
              targetApp: app as AppKind,
              enabled: true,
            },
          ];
        });
      });

    if (!demoMode && requests.length > 0) {
      await invoke("toggle_app_installs", { requests });
      await refresh({
        sourceIds: getSourceIdsForToolKinds(
          sources,
          Object.entries(bundleState.desiredApps)
            .filter(([, enabled]) => enabled)
            .map(([app]) => app as AppKind),
        ),
        includeUsage: false,
      });
    }

    persistCustomBundles(
      customBundles.map((entry) =>
        entry.id === bundleId
          ? {
              ...entry,
              lastSyncedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    );
  }

  async function repairBundle(bundleId: string) {
    const bundle = sortedSkills.find((entry) => entry.id === bundleId);
    const bundleState = customBundles.find((entry) => entry.id === bundleId);
    if (!bundle || !bundleState) {
      return;
    }

    const requests = Object.entries(bundleState.desiredApps)
      .flatMap(([app, enabled]) => {
        if (!enabled) {
          return [];
        }

        return bundle.members.flatMap((member) => {
          const sourceSkillPath =
            member.primaryInstallation?.skillPath ??
            member.installations[0]?.skillPath;
          if (!sourceSkillPath) {
            return [];
          }

          return [
            {
              skillId: member.canonicalId,
              sourceSkillPath,
              targetApp: app as AppKind,
              enabled: true,
            },
          ];
        });
      });

    if (!demoMode && requests.length > 0) {
      await invoke("toggle_app_installs", { requests });
      await refresh({
        sourceIds: getSourceIdsForToolKinds(
          sources,
          Object.entries(bundleState.desiredApps)
            .filter(([, enabled]) => enabled)
            .map(([app]) => app as AppKind),
        ),
        includeUsage: false,
      });
    }

    persistCustomBundles(
      customBundles.map((entry) =>
        entry.id === bundleId
          ? {
              ...entry,
              lastRepairedAt: new Date().toISOString(),
              lastSyncedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    );
  }

  async function batchApply(app: AppKind, enabled: boolean) {
    if (demoMode) {
      return;
    }

    const requests = sortedSkills
      .filter((skill) => selectedSkillIds.includes(skill.id))
      .flatMap((bundle) =>
        bundle.members.map((member) => {
          const sourceSkillPath =
            member.primaryInstallation?.skillPath ??
            member.installations[0]?.skillPath;

          if (!sourceSkillPath) {
            return null;
          }

          return {
            skillId: member.canonicalId,
            sourceSkillPath,
            targetApp: app,
            enabled,
          };
        }),
      )
      .filter((request): request is NonNullable<typeof request> => request !== null);

    if (requests.length === 0) {
      return;
    }

    setBatchBusy(true);
    try {
      await invoke("toggle_app_installs", { requests });
      setSelectedSkillIds([]);
      await refresh({
        sourceIds: getSourceIdsForToolKinds(sources, [app]),
        includeUsage: false,
      });
    } finally {
      setBatchBusy(false);
    }
  }

  return {
    loading,
    isDemoMode: demoMode,
    sources,
    appCounts,
    batchBusy,
    marketInstallBusyPackageId,
    usageMap,
    availableMemberSkills,
    installedApps,
    selectedSkillAiSummary,
    selectedAiProvider,
    allBundles: aggregatedBundles,
    skills: sortedSkills,
    selectedSkill,
    selectedSkillIds,
    search,
    selectedSourceId,
    selectedInstallationState,
    selectedToolKind,
    setSearch,
    setSelectedSourceId,
    setSelectedInstallationState,
    setSelectedToolKind,
    setSelectedSkillId,
    toggleSkillSelection,
    toggleSelectAllVisible,
    createLocalBundle,
    renameLocalBundle,
    deleteLocalBundle,
    toggleBundleMember,
    setBundleDesiredApp,
    syncBundle,
    repairBundle,
    clearSelection: () => setSelectedSkillIds([]),
    batchApply,
    refresh,
    refreshUsage,
    addFolder,
    importFromZip,
    exportSelectedSkills,
    installMarketPackage,
    openPath,
    browseSource,
    toggleApp,
    generateAiSummary,
    generateAiSummaryWithProvider,
  };
}

function toAiSummaryRequest(
  skill: SkillBundle,
  provider: AiSummaryProvider | null,
): AiSummaryRequest | null {
  const content = skill.primarySkill?.primaryInstallation?.content;
  const contentHash = skill.primarySkill?.primaryInstallation?.contentHash;
  if (!content || !contentHash) {
    return null;
  }

  return {
    skillName: skill.primarySkill?.name ?? skill.name,
    contentHash,
    content,
    provider,
  };
}

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}
