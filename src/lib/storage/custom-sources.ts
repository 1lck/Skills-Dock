const STORAGE_KEY = "skills-dock.custom-sources";

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
