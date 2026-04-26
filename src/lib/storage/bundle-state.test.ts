import { describe, expect, test } from "vitest";

import {
  createCustomBundleDefinition,
  createMemoryStorage,
  loadCustomBundles,
  saveCustomBundles,
} from "./custom-sources";

describe("bundle state storage", () => {
  test("restores saved custom bundle definitions", () => {
    const storage = createMemoryStorage();
    const bundle = createCustomBundleDefinition("My Bundle 1", [
      "frontend-skill",
      "code-review",
    ]);

    saveCustomBundles(storage, [bundle]);

    expect(loadCustomBundles(storage)).toEqual([bundle]);
  });

  test("creates stable bundle definitions with unique member ids", () => {
    const bundle = createCustomBundleDefinition("My Bundle 1", [
      "frontend-skill",
      "frontend-skill",
      "code-review",
    ]);

    expect(bundle.name).toBe("My Bundle 1");
    expect(bundle.memberSkillIds).toEqual(["frontend-skill", "code-review"]);
    expect(bundle.id).toContain("my-bundle-1");
    expect(bundle.desiredApps).toEqual({
      claude: false,
      codex: false,
      gemini: false,
      opencode: false,
    });
  });
});
