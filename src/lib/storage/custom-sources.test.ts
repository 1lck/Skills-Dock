import { describe, expect, test } from "vitest";

import {
  addCustomSource,
  createMemoryStorage,
  loadCustomSources,
  saveCustomSources,
} from "./custom-sources";

describe("custom source storage", () => {
  test("restores saved custom sources on startup", () => {
    const storage = createMemoryStorage();
    saveCustomSources(storage, ["/Users/lick/.skills", "/Users/lick/other-skills"]);

    expect(loadCustomSources(storage)).toEqual([
      "/Users/lick/.skills",
      "/Users/lick/other-skills",
    ]);
  });

  test("ignores duplicate roots while preserving insertion order", () => {
    const existing = ["/Users/lick/.skills"];

    expect(addCustomSource(existing, "/Users/lick/.skills")).toEqual(existing);
    expect(addCustomSource(existing, "/Users/lick/other-skills")).toEqual([
      "/Users/lick/.skills",
      "/Users/lick/other-skills",
    ]);
  });
});
