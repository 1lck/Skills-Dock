import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { aggregateInstalledSkills } from "../../lib/application/skills-catalog";
import type { SkillDetail, SourceRecord } from "../../lib/models/skill";
import { AppShell } from "./app-shell";

const sources: SourceRecord[] = [
  {
    id: "codex::/users/lick/.codex/skills",
    name: "Codex Skills",
    toolKind: "codex",
    sourceType: "builtin",
    rootPath: "/Users/lick/.codex/skills",
    status: "ready",
    lastIndexedAt: "2026-04-20T12:00:00.000Z",
  },
];

const rawSkills: SkillDetail[] = [
  {
    id: "frontend",
    name: "Frontend Skill",
    toolKind: "codex",
    sourceId: sources[0].id,
    sourcePath: sources[0].rootPath,
    skillPath: "/Users/lick/.codex/skills/frontend-skill",
    skillFilePath: "/Users/lick/.codex/skills/frontend-skill/SKILL.md",
    detectedFormat: "skill-md",
    compatibility: "codex",
    status: "valid",
    issues: [],
    preview: "Build modern interfaces.",
    updatedAt: "2026-04-20T12:00:00.000Z",
    content: "# Frontend Skill\n\nBuild modern interfaces.",
    contentHash: "hash-frontend",
    relatedFiles: [],
  },
];

const skills = aggregateInstalledSkills(rawSkills);
const appCounts = {
  claude: 0,
  codex: 1,
  gemini: 0,
  opencode: 0,
};

describe("AppShell", () => {
  test("renders source, skills, and detail regions", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={null}
        search=""
        selectedStatus="all"
        selectedToolKind="all"
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectStatus={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSkill={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
      />,
    );

    expect(screen.getByRole("region", { name: "Skills" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Skill Detail" })).toBeVisible();
  });

  test("applies selected filters to the visible list", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedStatus="all"
        selectedToolKind="all"
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectStatus={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSkill={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Search skills"), {
      target: { value: "frontend" },
    });

    expect(
      within(screen.getByRole("region", { name: "Skills" })).getByText(
        "Frontend Skill",
      ),
    ).toBeVisible();
    expect(
      within(screen.getByRole("region", { name: "Skills" })).queryByText(
        "Build modern interfaces.",
      ),
    ).toBeNull();
  });

  test("shows an empty detail state when no skill is selected", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={null}
        search=""
        selectedStatus="all"
        selectedToolKind="all"
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectStatus={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSkill={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
      />,
    );

    expect(screen.getByText("Select a skill to inspect its files and validation status.")).toBeVisible();
  });

  test("shows a demo mode banner when previewing mock data", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedStatus="all"
        selectedToolKind="all"
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectStatus={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSkill={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
      />,
    );

    expect(
      screen.getByText("当前是浏览器预览模式，列表使用演示数据。请运行桌面端以扫描本机 skills。"),
    ).toBeVisible();
  });

  test("toggles app install state from the skill row", () => {
    const onToggleApp = vi.fn();

    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedStatus="all"
        selectedToolKind="all"
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectStatus={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSkill={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={onToggleApp}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "切换 Claude 安装状态" }));

    expect(onToggleApp).toHaveBeenCalledWith("frontend-skill", "claude", true);
  });

  test("filters skills when clicking a top app summary chip", () => {
    const onSelectToolKind = vi.fn();

    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={appCounts}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedStatus="all"
        selectedToolKind="all"
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectStatus={vi.fn()}
        onSelectToolKind={onSelectToolKind}
        onSelectSkill={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "按 Claude 筛选" }));

    expect(onSelectToolKind).toHaveBeenCalledWith("claude");
  });

  test("keeps top app counts independent from the filtered list count", () => {
    render(
      <AppShell
        loading={false}
        isDemoMode={false}
        sources={sources}
        appCounts={{ claude: 11, codex: 26, gemini: 0, opencode: 0 }}
        skills={skills}
        selectedSkill={skills[0]}
        search=""
        selectedStatus="all"
        selectedToolKind="codex"
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddFolder={vi.fn()}
        onSelectStatus={vi.fn()}
        onSelectToolKind={vi.fn()}
        onSelectSkill={vi.fn()}
        onOpenPath={vi.fn()}
        onToggleApp={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "按 Codex 筛选" })).toHaveTextContent(
      "Codex: 26",
    );
    expect(screen.getByText("1")).toBeVisible();
  });
});
