const STORAGE_KEY = "skills-dock.custom-sources";
const SOURCE_OVERRIDES_KEY = "skills-dock.source-overrides";

export type SourceOverrideKey = "codex" | "claude" | "gemini" | "opencode";
export type SourceOverrides = Partial<Record<SourceOverrideKey, string>>;

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
