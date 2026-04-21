import { describe, expect, test } from "vitest";

import { buildDemoSnapshot, resolveDemoHomePath } from "./demo-snapshot";

describe("demo snapshot platform paths", () => {
  test("uses a macOS demo home when the user agent is from macOS", () => {
    expect(resolveDemoHomePath("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"))
      .toBe("/Users/demo");
  });

  test("uses a Windows demo home when the user agent is from Windows", () => {
    expect(resolveDemoHomePath("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"))
      .toBe("C:/Users/demo");
  });

  test("uses a Linux demo home when the user agent is from Linux", () => {
    expect(resolveDemoHomePath("Mozilla/5.0 (X11; Linux x86_64)"))
      .toBe("/home/demo");
  });

  test("builds builtin source paths from the resolved demo home", () => {
    const snapshot = buildDemoSnapshot([], "Mozilla/5.0 (X11; Linux x86_64)");

    expect(snapshot.sources.find((source) => source.name === "Codex Skills")?.rootPath)
      .toBe("/home/demo/.codex/skills");
    expect(snapshot.sources.find((source) => source.name === "Claude Skills")?.rootPath)
      .toBe("/home/demo/.claude/skills");
  });
});
