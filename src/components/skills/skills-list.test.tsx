import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { AggregatedInstalledSkill } from "../../lib/models/skill";
import { SkillsList } from "./skills-list";

const sourceId = "codex::/users/lick/.codex/skills";
const sourceRootPath = "/Users/lick/.codex/skills";
const installedApps = {
  claude: true,
  codex: true,
  gemini: true,
  opencode: true,
};

const skill: AggregatedInstalledSkill = {
  id: "frontend-skill",
  canonicalId: "frontend-skill",
  name: "Frontend Skill",
  status: "valid",
  installationState: "ready",
  preview: "Build modern interfaces.",
  updatedAt: "2026-04-20T12:00:00.000Z",
  apps: { claude: false, codex: true, gemini: false, opencode: false },
  installations: [
    {
      id: "frontend",
      toolKind: "codex",
      sourceId,
      sourcePath: sourceRootPath,
      skillPath: "/Users/lick/.codex/skills/frontend-skill",
      skillFilePath: "/Users/lick/.codex/skills/frontend-skill/SKILL.md",
      status: "valid",
      pathKind: "directory",
      contentHash: "hash-frontend",
      updatedAt: "2026-04-20T12:00:00.000Z",
    },
  ],
  primaryInstallation: null,
};

describe("SkillsList", () => {
  test("disables app toggle buttons for apps that are not installed locally", () => {
    const onToggleApp = vi.fn();

    render(
      <SkillsList
        skills={[skill]}
        loading={false}
        selectedSkillId={skill.id}
        selectedSkillIds={[]}
        batchBusy={false}
        usageMap={{}}
        installedApps={{ ...installedApps, gemini: false }}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={vi.fn()}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={vi.fn()}
        onToggleApp={onToggleApp}
      />,
    );

    const geminiToggle = screen.getByRole("button", { name: "切换 Gemini 安装状态" });
    expect(geminiToggle).toBeDisabled();

    fireEvent.click(geminiToggle);
    expect(onToggleApp).not.toHaveBeenCalled();
  });

  test.skip("supports selecting rows and triggering batch install actions [UI not yet implemented in SkillsList]", () => {
    const onToggleSkillSelection = vi.fn();
    const onBatchApply = vi.fn();

    render(
      <SkillsList
        skills={[skill]}
        loading={false}
        selectedSkillId={skill.id}
        selectedSkillIds={[skill.id]}
        batchBusy={false}
        usageMap={{}}
        installedApps={installedApps}
        onSelectSkill={vi.fn()}
        onToggleSkillSelection={onToggleSkillSelection}
        onToggleSelectAllVisible={vi.fn()}
        onClearSelection={vi.fn()}
        onBatchApply={onBatchApply}
        onToggleApp={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "选择 Frontend Skill" }));
    fireEvent.click(screen.getByRole("button", { name: "批量安装到 Claude" }));

    expect(onToggleSkillSelection).toHaveBeenCalledWith(skill.id);
    expect(onBatchApply).toHaveBeenCalledWith("claude", true);
  });
});
