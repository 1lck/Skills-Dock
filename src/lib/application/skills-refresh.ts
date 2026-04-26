import type { SkillDetail, SkillSnapshot, SourceRecord, ToolKind } from "../models/skill";

export function getSourceIdsForToolKinds(
  sources: SourceRecord[],
  toolKinds: ToolKind[],
): string[] {
  const kinds = new Set(toolKinds);
  return sources
    .filter((source) => kinds.has(source.toolKind))
    .map((source) => source.id);
}

export function mergePartialSnapshot(
  currentSources: SourceRecord[],
  currentSkills: SkillDetail[],
  partialSnapshot: SkillSnapshot,
): SkillSnapshot {
  const replacedSourceIds = new Set(partialSnapshot.sources.map((source) => source.id));

  return {
    sources: [
      ...currentSources.filter((source) => !replacedSourceIds.has(source.id)),
      ...partialSnapshot.sources,
    ],
    skills: [
      ...currentSkills.filter((skill) => !replacedSourceIds.has(skill.sourceId)),
      ...partialSnapshot.skills,
    ],
  };
}
