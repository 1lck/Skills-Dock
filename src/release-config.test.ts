import { describe, expect, test } from "vitest";
import packageJson from "../package.json";
import tauriConfig from "../src-tauri/tauri.conf.json";

describe("release configuration", () => {
  test("keeps package and tauri versions in sync", () => {
    expect(tauriConfig.version).toBe(packageJson.version);
  });

  test("enables updater artifact generation for GitHub Releases", () => {
    expect(tauriConfig.bundle?.createUpdaterArtifacts).toBe(true);
  });
});
