import { open } from "@tauri-apps/plugin-dialog";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import {
  aggregateInstalledSkills,
  countInstalledApps,
} from "../lib/application/skills-catalog";
import { buildDemoSnapshot } from "../lib/fixtures/demo-snapshot";
import type {
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
    } else {
      snapshot = buildDemoSnapshot(customRoots);
    }

    setSources(snapshot.sources);
    setAllSkills(snapshot.skills);
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

  useEffect(() => {
    if (filteredSkills.length === 0) {
      setSelectedSkillId(null);
      return;
    }

    if (selectedSkillId && !filteredSkills.some((skill) => skill.id === selectedSkillId)) {
      setSelectedSkillId(null);
    }
  }, [filteredSkills, selectedSkillId]);

  useEffect(() => {
    const visibleIds = new Set(filteredSkills.map((skill) => skill.id));
    setSelectedSkillIds((current) => current.filter((skillId) => visibleIds.has(skillId)));
  }, [filteredSkills]);

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
          if (s.canonicalId === skillId) {
            return {
              ...s,
              apps: {
                ...s.apps,
                [app]: enabled,
              },
            };
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

    const requests = filteredSkills
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
    skills: filteredSkills,
    selectedSkill:
      filteredSkills.find((skill) => skill.id === selectedSkillId) ?? null,
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
    openPath,
    toggleApp,
  };
}
