import type { SkillStatus, SkillSummary, SourceRecord, ToolKind } from "../models/skill";

export interface SkillsFilter {
  search: string;
  toolKind: ToolKind | "all";
  status: SkillStatus | "all";
  sourceId: string | "all";
}

export type SortMode = "updated-desc" | "name-asc";

export function filterSkills(
  skills: SkillSummary[],
  filters: SkillsFilter,
): SkillSummary[] {
  const query = filters.search.trim().toLowerCase();

  return skills.filter((skill) => {
    if (filters.toolKind !== "all" && skill.toolKind !== filters.toolKind) {
      return false;
    }

    if (filters.status !== "all" && skill.status !== filters.status) {
      return false;
    }

    if (filters.sourceId !== "all" && skill.sourceId !== filters.sourceId) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [skill.name, skill.preview].some((value) =>
      value.toLowerCase().includes(query),
    );
  });
}

export function sortSkills(
  skills: SkillSummary[],
  mode: SortMode,
): SkillSummary[] {
  return [...skills].sort((left, right) => {
    if (mode === "name-asc") {
      return left.name.localeCompare(right.name);
    }

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });
}

export function filterTypedSkills<T extends SkillSummary>(
  skills: T[],
  filters: SkillsFilter,
): T[] {
  return filterSkills(skills, filters) as T[];
}

export function sortTypedSkills<T extends SkillSummary>(
  skills: T[],
  mode: SortMode,
): T[] {
  return sortSkills(skills, mode) as T[];
}

export function groupSources(sources: SourceRecord[]): {
  builtin: SourceRecord[];
  custom: SourceRecord[];
} {
  return {
    builtin: sources.filter((source) => source.sourceType === "builtin"),
    custom: sources.filter((source) => source.sourceType === "custom"),
  };
}
