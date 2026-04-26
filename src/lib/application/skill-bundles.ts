import type {
  AggregatedInstalledSkill,
  BundleGroupingKind,
  InstallationState,
  InstalledAppState,
  SkillBundle,
  SkillStatus,
  SourceRecord,
} from "../models/skill";
import type { CustomBundleDefinition } from "../storage/custom-sources";
import type { SkillUsageMap } from "../storage/skill-usage";

const EMPTY_APPS: InstalledAppState = {
  claude: false,
  codex: false,
  gemini: false,
  opencode: false,
};

const GENERIC_ROOT_NAMES = new Set(["skills", "skill", "agents", "prompts"]);
const TOOL_HOME_SEGMENTS = new Set([
  ".codex",
  ".claude",
  ".gemini",
  ".opencode",
]);

export function aggregateSkillBundles(
  skills: AggregatedInstalledSkill[],
  sources: SourceRecord[],
  usageMap: SkillUsageMap = {},
  customBundles: CustomBundleDefinition[] = [],
): SkillBundle[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const groups = new Map<string, AggregatedInstalledSkill[]>();

  for (const skill of skills) {
    const key = inferBundleKey(skill, sourceById);
    groups.set(key.id, [...(groups.get(key.id) ?? []), skill]);
  }

  const derivedBundles = [...groups.entries()]
    .map(([bundleId, members]) => {
      const primarySkill = pickPrimarySkill(members);
      const usageCount = members.reduce(
        (sum, member) => sum + (usageMap[member.canonicalId]?.callCount ?? 0),
        0,
      );
      const sourcePaths = uniqueStrings(
        members.flatMap((member) => member.installations.map((item) => item.sourcePath)),
      );
      const sourceIds = uniqueStrings(
        members.flatMap((member) => member.installations.map((item) => item.sourceId)),
      );
      const apps = members.reduce<InstalledAppState>((state, member) => {
        for (const app of Object.keys(member.apps) as Array<keyof InstalledAppState>) {
          state[app] = state[app] || member.apps[app];
        }
        return state;
      }, { ...EMPTY_APPS });

      const grouping = inferBundleKey(primarySkill ?? members[0], sourceById);
      const sortedMembers = members
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name));

      return {
        id: bundleId,
        canonicalId: bundleId,
        name: grouping.name,
        groupingKind: grouping.kind,
        originType: "source" as const,
        syncStatus: "unmanaged" as const,
        status: deriveBundleStatus(members.map((member) => member.status)),
        installationState: deriveBundleInstallationState(
          members.map((member) => member.installationState),
        ),
        preview: buildBundlePreview(sortedMembers),
        updatedAt: sortedMembers
          .map((member) => member.updatedAt)
          .sort((left, right) => right.localeCompare(left))[0],
        apps,
        desiredApps: { ...EMPTY_APPS },
        sourceIds,
        sourcePaths,
        memberCount: sortedMembers.length,
        usageCount,
        missingMemberSkillIds: [],
        lastSyncedAt: null,
        lastRepairedAt: null,
        members: sortedMembers,
        primarySkill,
      };
    })
    .sort((left, right) => {
      const usageDiff = right.usageCount - left.usageCount;
      if (usageDiff !== 0) {
        return usageDiff;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });

  const skillByCanonicalId = new Map(
    skills.map((skill) => [skill.canonicalId, skill]),
  );
  const overlayBundles = customBundles.flatMap((bundle) => {
    const members = bundle.memberSkillIds
      .map((memberId) => skillByCanonicalId.get(memberId))
      .filter((member): member is AggregatedInstalledSkill => member !== undefined)
      .sort((left, right) => left.name.localeCompare(right.name));

    if (members.length === 0) {
      return [];
    }

    const primarySkill = pickPrimarySkill(members);
    const apps = members.reduce<InstalledAppState>((state, member) => {
      for (const app of Object.keys(member.apps) as Array<keyof InstalledAppState>) {
        state[app] = state[app] || member.apps[app];
      }
      return state;
    }, { ...EMPTY_APPS });

    return [
      {
        id: bundle.id,
        canonicalId: bundle.id,
        name: bundle.name,
        groupingKind: "custom" as const,
        originType: "custom" as const,
        syncStatus: deriveCustomBundleSyncStatus(
          bundle,
          members,
          bundle.memberSkillIds.filter(
            (memberId) => !skillByCanonicalId.has(memberId),
          ),
        ),
        status: deriveBundleStatus(members.map((member) => member.status)),
        installationState: deriveBundleInstallationState(
          members.map((member) => member.installationState),
        ),
        preview: buildBundlePreview(members),
        updatedAt: bundle.updatedAt,
        apps,
        desiredApps: { ...bundle.desiredApps },
        sourceIds: uniqueStrings(
          members.flatMap((member) => member.installations.map((item) => item.sourceId)),
        ),
        sourcePaths: uniqueStrings(
          members.flatMap((member) => member.installations.map((item) => item.sourcePath)),
        ),
        memberCount: members.length,
        usageCount: members.reduce(
          (sum, member) => sum + (usageMap[member.canonicalId]?.callCount ?? 0),
          0,
        ),
        missingMemberSkillIds: bundle.memberSkillIds.filter(
          (memberId) => !skillByCanonicalId.has(memberId),
        ),
        lastSyncedAt: bundle.lastSyncedAt,
        lastRepairedAt: bundle.lastRepairedAt,
        members,
        primarySkill,
      },
    ];
  });

  return [...overlayBundles, ...derivedBundles].sort((left, right) => {
    const kindDiff = groupingRank(right.groupingKind) - groupingRank(left.groupingKind);
    if (kindDiff !== 0) {
      return kindDiff;
    }

    const usageDiff = right.usageCount - left.usageCount;
    if (usageDiff !== 0) {
      return usageDiff;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

function inferBundleKey(
  skill: AggregatedInstalledSkill,
  sourceById: Map<string, SourceRecord>,
): { id: string; kind: BundleGroupingKind; name: string } {
  const primarySourceId =
    skill.primaryInstallation?.sourceId ?? skill.installations[0]?.sourceId ?? "";
  const source =
    sourceById.get(primarySourceId) ??
    (skill.primaryInstallation
      ? ({
          id: skill.primaryInstallation.sourceId,
          name: skill.primaryInstallation.sourceId,
          toolKind: skill.primaryInstallation.toolKind,
          sourceType: "custom",
          rootPath: skill.primaryInstallation.sourcePath,
          status: "ready",
          lastIndexedAt: null,
        } as SourceRecord)
      : null);

  if (!source) {
    return {
      id: skill.canonicalId,
      kind: "single-skill",
      name: skill.name,
    };
  }

  const rootPath = normalizePath(source.rootPath);
  const rootBase = basename(rootPath);
  const parentBase = basename(dirname(rootPath));

  if (rootBase === "skills" && isNamedPackParent(parentBase)) {
    return {
      id: `${source.id}::bundle::${parentBase.toLowerCase()}`,
      kind: "source-parent",
      name: parentBase,
    };
  }

  if (source.sourceType === "custom" && !GENERIC_ROOT_NAMES.has(rootBase.toLowerCase())) {
    return {
      id: `${source.id}::bundle::root`,
      kind: "source-root",
      name: rootBase,
    };
  }

  return {
    id: skill.canonicalId,
    kind: "single-skill",
    name: skill.name,
  };
}

function deriveBundleStatus(statuses: SkillStatus[]): SkillStatus {
  if (statuses.includes("invalid")) {
    return "invalid";
  }

  if (statuses.includes("warning")) {
    return "warning";
  }

  return "valid";
}

function deriveBundleInstallationState(
  states: InstallationState[],
): InstallationState {
  if (states.includes("conflict")) {
    return "conflict";
  }

  if (states.includes("attention")) {
    return "attention";
  }

  if (states.includes("linked")) {
    return "linked";
  }

  if (states.every((state) => state === "external")) {
    return "external";
  }

  return "ready";
}

function buildBundlePreview(members: AggregatedInstalledSkill[]): string {
  if (members.length === 0) {
    return "";
  }

  if (members.length === 1) {
    return members[0].preview;
  }

  return `${members.length} 个成员技能：${members
    .slice(0, 3)
    .map((member) => member.name)
    .join("、")}`;
}

function pickPrimarySkill(
  members: AggregatedInstalledSkill[],
): AggregatedInstalledSkill | null {
  return (
    members
      .slice()
      .sort((left, right) => {
        const stateDiff =
          installationStateRank(right.installationState) -
          installationStateRank(left.installationState);
        if (stateDiff !== 0) {
          return stateDiff;
        }

        return right.updatedAt.localeCompare(left.updatedAt);
      })[0] ?? null
  );
}

function installationStateRank(state: InstallationState): number {
  switch (state) {
    case "ready":
      return 5;
    case "linked":
      return 4;
    case "external":
      return 3;
    case "attention":
      return 2;
    case "conflict":
      return 1;
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function groupingRank(kind: BundleGroupingKind): number {
  switch (kind) {
    case "custom":
      return 5;
    case "manifest":
      return 4;
    case "source-parent":
      return 3;
    case "source-root":
      return 2;
    case "single-skill":
      return 1;
  }
}

function deriveCustomBundleSyncStatus(
  bundle: CustomBundleDefinition,
  members: AggregatedInstalledSkill[],
  missingMemberSkillIds: string[],
): SkillBundle["syncStatus"] {
  if (missingMemberSkillIds.length > 0) {
    return "drifted";
  }

  const enabledTargets = Object.entries(bundle.desiredApps).filter(
    ([, enabled]) => enabled,
  );
  if (enabledTargets.length === 0) {
    return "idle";
  }

  const allTargetsSynced = enabledTargets.every(([app]) =>
    members.every((member) => member.apps[app as keyof InstalledAppState]),
  );

  if (allTargetsSynced) {
    return "synced";
  }

  return bundle.lastSyncedAt ? "drifted" : "pending";
}

function normalizePath(value: string): string {
  return value.replace(/\\/gu, "/").replace(/\/+$/u, "");
}

function dirname(value: string): string {
  const normalized = normalizePath(value);
  const index = normalized.lastIndexOf("/");
  return index <= 0 ? normalized : normalized.slice(0, index);
}

function basename(value: string): string {
  const normalized = normalizePath(value);
  const index = normalized.lastIndexOf("/");
  return index < 0 ? normalized : normalized.slice(index + 1);
}

function isNamedPackParent(parentBase: string): boolean {
  const normalized = parentBase.trim().toLowerCase();
  if (!normalized || GENERIC_ROOT_NAMES.has(normalized)) {
    return false;
  }

  return !TOOL_HOME_SEGMENTS.has(normalized);
}
