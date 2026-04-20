import type {
  AggregatedInstalledSkill,
  AppKind,
  InstalledAppState,
  SkillDetail,
  SkillStatus,
} from "../models/skill";

const EMPTY_APPS: InstalledAppState = {
  claude: false,
  codex: false,
  gemini: false,
  opencode: false,
};

export function aggregateInstalledSkills(
  skills: SkillDetail[],
): AggregatedInstalledSkill[] {
  const groups = new Map<string, SkillDetail[]>();

  for (const skill of skills) {
    const key = canonicalizeSkill(skill);
    groups.set(key, [...(groups.get(key) ?? []), skill]);
  }

  return [...groups.entries()]
    .map(([canonicalId, entries]) => {
      const primaryInstallation = pickPrimaryInstallation(entries);
      const apps = entries.reduce<InstalledAppState>((state, entry) => {
        if (isAppKind(entry.toolKind)) {
          state[entry.toolKind] = true;
        }
        return state;
      }, { ...EMPTY_APPS });
      const status = deriveAggregateStatus(entries.map((entry) => entry.status));
      const preview = primaryInstallation?.preview ?? entries[0]?.preview ?? "";
      const updatedAt = entries
        .map((entry) => entry.updatedAt)
        .sort((left, right) => right.localeCompare(left))[0];

      return {
        id: canonicalId,
        canonicalId,
        name: primaryInstallation?.name ?? entries[0]?.name ?? canonicalId,
        status,
        preview,
        updatedAt,
        apps,
        installations: entries
          .slice()
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
          .map((entry) => ({
            id: entry.id,
            toolKind: entry.toolKind,
            sourceId: entry.sourceId,
            sourcePath: entry.sourcePath,
            skillPath: entry.skillPath,
            skillFilePath: entry.skillFilePath,
            status: entry.status,
            contentHash: entry.contentHash,
            updatedAt: entry.updatedAt,
          })),
        primaryInstallation,
      };
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function countInstalledApps(
  skills: AggregatedInstalledSkill[],
): Record<AppKind, number> {
  return skills.reduce(
    (counts, skill) => {
      for (const app of Object.keys(skill.apps) as AppKind[]) {
        if (skill.apps[app]) {
          counts[app] += 1;
        }
      }
      return counts;
    },
    { claude: 0, codex: 0, gemini: 0, opencode: 0 },
  );
}

function canonicalizeSkill(skill: SkillDetail): string {
  return (skill.skillPath.split("/").pop() ?? skill.name)
    .trim()
    .toLowerCase();
}

function pickPrimaryInstallation(entries: SkillDetail[]): SkillDetail | null {
  return (
    entries
      .slice()
      .sort((left, right) => {
        const score = statusRank(right.status) - statusRank(left.status);
        if (score !== 0) {
          return score;
        }

        return right.updatedAt.localeCompare(left.updatedAt);
      })[0] ?? null
  );
}

function deriveAggregateStatus(statuses: SkillStatus[]): SkillStatus {
  if (statuses.includes("invalid")) {
    return "invalid";
  }

  if (statuses.includes("warning")) {
    return "warning";
  }

  return "valid";
}

function statusRank(status: SkillStatus): number {
  switch (status) {
    case "invalid":
      return 3;
    case "warning":
      return 2;
    case "valid":
      return 1;
  }
}

function isAppKind(toolKind: SkillDetail["toolKind"]): toolKind is AppKind {
  return toolKind !== "generic";
}
