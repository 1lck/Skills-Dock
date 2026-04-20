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
  SkillDetail,
  SkillSnapshot,
  SkillStatus,
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
  const [search, setSearch] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState<string | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<SkillStatus | "all">("all");
  const [selectedToolKind, setSelectedToolKind] = useState<ToolKind | "all">("all");

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

  const filteredSkills = aggregatedSkills.filter((skill) => {
    if (selectedStatus !== "all" && skill.status !== selectedStatus) {
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

    return [skill.name, skill.preview].some((value) => value.toLowerCase().includes(query));
  });

  useEffect(() => {
    if (filteredSkills.length === 0) {
      setSelectedSkillId(null);
      return;
    }

    if (!selectedSkillId || !filteredSkills.some((skill) => skill.id === selectedSkillId)) {
      setSelectedSkillId(filteredSkills[0].id);
    }
  }, [filteredSkills, selectedSkillId]);

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

  return {
    loading,
    isDemoMode: demoMode,
    sources,
    appCounts,
    skills: filteredSkills,
    selectedSkill:
      filteredSkills.find((skill) => skill.id === selectedSkillId) ?? null,
    search,
    selectedSourceId,
    selectedStatus,
    selectedToolKind,
    setSearch,
    setSelectedSourceId,
    setSelectedStatus,
    setSelectedToolKind,
    setSelectedSkillId,
    refresh,
    addFolder,
    openPath,
    toggleApp,
  };
}
