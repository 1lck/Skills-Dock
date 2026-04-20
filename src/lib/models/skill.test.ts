import { describe, expect, test } from "vitest";

import {
  deriveSkillStatus,
  makePreview,
  makeSkillId,
  makeSourceId,
} from "./skill";

describe("skill model helpers", () => {
  test("creates stable source and skill identifiers from paths", () => {
    const sourceId = makeSourceId("codex", "/Users/lick/.codex/skills");

    expect(sourceId).toBe("codex::/users/lick/.codex/skills");
    expect(makeSkillId(sourceId, "frontend-skill")).toBe(
      "codex::/users/lick/.codex/skills::frontend-skill",
    );
  });

  test("derives warning and invalid states from issue severity", () => {
    expect(deriveSkillStatus([])).toBe("valid");
    expect(
      deriveSkillStatus([
        {
          code: "missing-title",
          message: "No title heading found in the markdown file.",
          severity: "warning",
        },
      ]),
    ).toBe("warning");
    expect(
      deriveSkillStatus([
        {
          code: "missing-skill-file",
          message: "SKILL.md does not exist.",
          severity: "error",
        },
      ]),
    ).toBe("invalid");
  });

  test("normalizes markdown into a compact text preview", () => {
    const preview = makePreview(`---
name: frontend-skill
description: UI helper
---

# Frontend Skill

Build modern interfaces.

\`\`\`tsx
export const sample = true;
\`\`\`
`);

    expect(preview).toBe("Frontend Skill Build modern interfaces.");
  });
});
