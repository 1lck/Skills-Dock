const STORAGE_KEY = "skills-dock.custom-sources";
const SOURCE_OVERRIDES_KEY = "skills-dock.source-overrides";
const CUSTOM_BUNDLES_KEY = "skills-dock.custom-bundles";

export type SourceOverrideKey = "codex" | "claude" | "gemini" | "opencode";
export type SourceOverrides = Partial<Record<SourceOverrideKey, string>>;
export type BundleTargetApps = {
  claude: boolean;
  codex: boolean;
  gemini: boolean;
  opencode: boolean;
};
export interface CustomBundleDefinition {
  id: string;
  name: string;
  memberSkillIds: string[];
  desiredApps: BundleTargetApps;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
  lastRepairedAt: string | null;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();

  return {
    getItem(key) {
      return map.get(key) ?? null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}

export function loadCustomSources(storage: StorageLike): string[] {
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveCustomSources(storage: StorageLike, roots: string[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(roots));
}

export function addCustomSource(existingRoots: string[], nextRoot: string): string[] {
  return existingRoots.includes(nextRoot)
    ? existingRoots
    : [...existingRoots, nextRoot];
}

export function loadSourceOverrides(storage: StorageLike): SourceOverrides {
  const raw = storage.getItem(SOURCE_OVERRIDES_KEY);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const parsedRecord = parsed as Record<string, unknown>;
    const overrides: SourceOverrides = {};
    for (const key of ["codex", "claude", "gemini", "opencode"] as const) {
      const value = parsedRecord[key];
      if (typeof value === "string" && value.trim()) {
        overrides[key] = value;
      }
    }
    return overrides;
  } catch {
    return {};
  }
}

export function saveSourceOverrides(
  storage: StorageLike,
  overrides: SourceOverrides,
): void {
  storage.setItem(SOURCE_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function loadCustomBundles(storage: StorageLike): CustomBundleDefinition[] {
  const raw = storage.getItem(CUSTOM_BUNDLES_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return [];
      }

      const candidate = entry as Record<string, unknown>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.name !== "string" ||
        typeof candidate.createdAt !== "string" ||
        typeof candidate.updatedAt !== "string" ||
        !Array.isArray(candidate.memberSkillIds)
      ) {
        return [];
      }

      const memberSkillIds = candidate.memberSkillIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      );

      return [
        {
          id: candidate.id,
          name: candidate.name,
          memberSkillIds,
          desiredApps: normalizeDesiredApps(candidate.desiredApps),
          createdAt: candidate.createdAt,
          updatedAt: candidate.updatedAt,
          lastSyncedAt:
            typeof candidate.lastSyncedAt === "string" ? candidate.lastSyncedAt : null,
          lastRepairedAt:
            typeof candidate.lastRepairedAt === "string"
              ? candidate.lastRepairedAt
              : null,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function saveCustomBundles(
  storage: StorageLike,
  bundles: CustomBundleDefinition[],
): void {
  storage.setItem(CUSTOM_BUNDLES_KEY, JSON.stringify(bundles));
}

export function createCustomBundleDefinition(
  name: string,
  memberSkillIds: string[],
  now = new Date().toISOString(),
): CustomBundleDefinition {
  const normalizedName = name.trim() || "My Bundle";
  const uniqueMemberSkillIds = [...new Set(memberSkillIds)];
  const slug = normalizedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return {
    id: `custom::${slug || "bundle"}`,
    name: normalizedName,
    memberSkillIds: uniqueMemberSkillIds,
    desiredApps: emptyDesiredApps(),
    createdAt: now,
    updatedAt: now,
    lastSyncedAt: null,
    lastRepairedAt: null,
  };
}

export function emptyDesiredApps(): BundleTargetApps {
  return {
    claude: false,
    codex: false,
    gemini: false,
    opencode: false,
  };
}

function normalizeDesiredApps(value: unknown): BundleTargetApps {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyDesiredApps();
  }

  const candidate = value as Record<string, unknown>;
  return {
    claude: candidate.claude === true,
    codex: candidate.codex === true,
    gemini: candidate.gemini === true,
    opencode: candidate.opencode === true,
  };
}
