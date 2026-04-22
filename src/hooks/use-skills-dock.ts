import { message, open, save } from "@tauri-apps/plugin-dialog";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import {
  aggregateInstalledSkills,
  countInstalledApps,
  sortInstalledSkills,
} from "../lib/application/skills-catalog";
import { buildDemoSnapshot } from "../lib/fixtures/demo-snapshot";
import type {
  AiSummaryProvider,
  AiSummaryRequest,
  AiSummaryState,
} from "../lib/models/ai-summary";
import type {
  AggregatedInstalledSkill,
  AppKind,
  InstallationState,
  SkillDetail,
  SkillSnapshot,
  SourceInput,
  SourceRecord,
  ToolKind,
} from "../lib/models/skill";
import {
  addCustomSource,
  loadCustomSources,
  saveCustomSources,
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
  const [usageMap, setUsageMap] = useState<SkillUsageMap>({});
  const [installedApps, setInstalledApps] = useState<Record<string, boolean>>({});
  const [selectedSkillAiSummary, setSelectedSkillAiSummary] = useState<AiSummaryState | null>(null);
  const [selectedAiProvider, setSelectedAiProvider] = useState<AiSummaryProvider | null>(null);

  async function refresh(customRootsOverride?: string[]) {
    setLoading(true);
    const customRoots = customRootsOverride ?? loadCustomSources(storage);

    let snapshot: SkillSnapshot;
    if (!demoMode) {
      const resolvedSources = await invoke<SourceRecord[]>("load_sources", {
        customRoots,
      });
      snapshot = await invoke<SkillSnapshot>("scan_sources", {
        sources: resolvedSources.map(toSourceInput),
      });
      
      const appsInstalled = await invoke<Record<string, boolean>>("get_installed_apps");
      setInstalledApps(appsInstalled);
    } else {
      snapshot = buildDemoSnapshot(customRoots);
      setInstalledApps({ codex: true, claude: true, gemini: true, opencode: true });
    }

    setSources(snapshot.sources);
    setAllSkills(snapshot.skills);

    // 扫描 Claude / Codex / Gemini / OpenCode 的本地会话记录，获取真实调用次数
    if (!demoMode) {
      const scanned = await invoke<SkillUsageMap>("scan_skill_usage");
      setUsageMap(scanned);
    }

    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const aggregatedSkills = aggregateInstalledSkills(allSkills);
  const appCounts = countInstalledApps(aggregatedSkills);
  const sourcesById = new Map(sources.map((source) => [source.id, source]));

  const filteredSkills = aggregatedSkills.filter((skill) => {
    if (
      selectedInstallationState !== "all" &&
      skill.installationState !== selectedInstallationState
    ) {
      return false;
    }

    if (
      selectedToolKind !== "all" &&
      !skill.installations.some((installation) => installation.toolKind === selectedToolKind)
    ) {
      return false;
    }

    if (
      selectedSourceId !== "all" &&
      !skill.installations.some((installation) => installation.sourceId === selectedSourceId)
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
      ...skill.installations.flatMap((installation) => [
        sourcesById.get(installation.sourceId)?.name ?? "",
        installation.skillPath,
      ]),
    ].some((value) => value.toLowerCase().includes(query));
  });
  const sortedSkills = sortInstalledSkills(filteredSkills, usageMap);
  const selectedSkill =
    sortedSkills.find((skill) => skill.id === selectedSkillId) ?? null;
  const selectedSkillSummaryRequest = selectedSkill
    ? toAiSummaryRequest(selectedSkill, selectedAiProvider)
    : null;

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
    await refresh(nextRoots);
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
      await refresh(nextRoots);
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


  async function toggleApp(skillId: string, app: AppKind, enabled: boolean) {
    const aggregated = aggregateInstalledSkills(allSkills);
    const skill = aggregated.find((entry) => entry.canonicalId === skillId);
    const sourcePath =
      skill?.primaryInstallation?.skillPath ??
      skill?.installations[0]?.skillPath;

    if (!sourcePath) {
      return;
    }

    if (demoMode) {
      setAllSkills((current) =>
        current.map((s) => {
          if (s.id === skillId || s.sourcePath === sourcePath) {
            return { ...s };
          }
          return s;
        }),
      );
      return;
    }

    await invoke("toggle_app_install", {
      request: {
        skillId,
        sourceSkillPath: sourcePath,
        targetApp: app,
        enabled,
      },
    });
    await refresh();
  }

  async function exportSelectedSkills() {
    if (demoMode || selectedSkillIds.length === 0) {
      return;
    }

    const skills = sortedSkills
      .filter((skill) => selectedSkillIds.includes(skill.id))
      .map((skill) => {
        const sourceSkillPath =
          skill.primaryInstallation?.skillPath ?? skill.installations[0]?.skillPath;

        if (!sourceSkillPath) {
          return null;
        }

        return {
          skillId: skill.canonicalId,
          sourceSkillPath,
        };
      })
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

  async function batchApply(app: AppKind, enabled: boolean) {
    if (demoMode) {
      return;
    }

    const requests = sortedSkills
      .filter((skill) => selectedSkillIds.includes(skill.id))
      .map((skill) => {
        const sourceSkillPath =
          skill.primaryInstallation?.skillPath ?? skill.installations[0]?.skillPath;

        if (!sourceSkillPath) {
          return null;
        }

        return {
          skillId: skill.canonicalId,
          sourceSkillPath,
          targetApp: app,
          enabled,
        };
      })
      .filter((request): request is NonNullable<typeof request> => request !== null);

    if (requests.length === 0) {
      return;
    }

    setBatchBusy(true);
    try {
      await invoke("toggle_app_installs", { requests });
      setSelectedSkillIds([]);
      await refresh();
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
    usageMap,
    installedApps,
    selectedSkillAiSummary,
    selectedAiProvider,
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
    clearSelection: () => setSelectedSkillIds([]),
    batchApply,
    refresh,
    addFolder,
    importFromZip,
    exportSelectedSkills,
    openPath,
    toggleApp,
    generateAiSummary,
    generateAiSummaryWithProvider,
  };
}

function toAiSummaryRequest(
  skill: AggregatedInstalledSkill,
  provider: AiSummaryProvider | null,
): AiSummaryRequest | null {
  const content = skill.primaryInstallation?.content;
  const contentHash = skill.primaryInstallation?.contentHash;
  if (!content || !contentHash) {
    return null;
  }

  return {
    skillName: skill.name,
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
