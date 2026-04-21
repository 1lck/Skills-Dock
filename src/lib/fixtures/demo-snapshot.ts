import {
  type SkillDetail,
  type SkillSnapshot,
  type SourceRecord,
  makeSkillId,
  makeSourceId,
} from "../models/skill";

function makeSource(
  name: string,
  toolKind: SourceRecord["toolKind"],
  sourceType: SourceRecord["sourceType"],
  rootPath: string,
  status: SourceRecord["status"],
): SourceRecord {
  return {
    id: makeSourceId(toolKind, rootPath),
    name,
    toolKind,
    sourceType,
    rootPath,
    status,
    lastIndexedAt: "2026-04-20T12:00:00.000Z",
  };
}

function makeSkill(
  source: SourceRecord,
  name: string,
  relativePath: string,
  preview: string,
  status: SkillDetail["status"],
  compatibility: SkillDetail["compatibility"],
  content: string,
  issueMessage?: string,
): SkillDetail {
  return {
    id: makeSkillId(source.id, relativePath),
    name,
    toolKind: source.toolKind,
    sourceId: source.id,
    sourcePath: source.rootPath,
    skillPath: `${source.rootPath}/${relativePath}`,
    skillFilePath: `${source.rootPath}/${relativePath}/SKILL.md`,
    detectedFormat: "skill-md",
    compatibility,
    status,
    pathKind: "directory",
    issues: issueMessage
      ? [{ code: "missing-title", message: issueMessage, severity: "warning" }]
      : [],
    preview,
    updatedAt: "2026-04-20T12:00:00.000Z",
    content,
    contentHash: `${source.toolKind}:${relativePath}`,
    relatedFiles: [],
  };
}

export function resolveDemoHomePath(userAgent: string): string {
  if (/Windows/i.test(userAgent)) {
    return "C:/Users/demo";
  }

  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return "/Users/demo";
  }

  return "/home/demo";
}

export function buildDemoSnapshot(
  customRoots: string[],
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
): SkillSnapshot {
  const demoHome = resolveDemoHomePath(userAgent);
  const codex = makeSource("Codex Skills", "codex", "builtin", `${demoHome}/.codex/skills`, "ready");
  const superpowers = makeSource(
    "Codex Superpowers",
    "codex",
    "builtin",
    `${demoHome}/.codex/superpowers/skills`,
    "ready",
  );
  const claude = makeSource("Claude Skills", "claude", "builtin", `${demoHome}/.claude/skills`, "warning");
  const gemini = makeSource("Gemini Skills", "gemini", "builtin", `${demoHome}/.gemini/skills`, "ready");
  const opencode = makeSource(
    "OpenCode Skills",
    "opencode",
    "builtin",
    `${demoHome}/.opencode/skills`,
    "ready",
  );
  const customSources = customRoots.map((rootPath, index) =>
    makeSource(`Custom ${index + 1}`, "generic", "custom", rootPath, "ready"),
  );

  const sources = [codex, superpowers, claude, gemini, opencode, ...customSources];
  const skills: SkillDetail[] = [
    makeSkill(
      codex,
      "Error Resolver",
      "error-resolver",
      "Systematic error diagnosis and resolution using first-principle analysis.",
      "valid",
      "codex",
      `# Error Resolver

You are an expert Error Resolver agent. Your goal is to systematically diagnose and resolve complex engineering issues using first-principle analysis.

## Core Directives
1. **Analyze First**: Do not jump to conclusions. Read the stack trace, error logs, and the surrounding code context carefully.
2. **Reproduce the Issue**: Mentally or technically outline the steps required to trigger the bug.
3. **Identify the Root Cause**: Ask "Why?" at least 5 times until you hit the fundamental architectural or logical flaw.
4. **Propose Solutions**: Outline 2-3 potential fixes. Evaluate trade-offs (performance, readability, backwards compatibility).
5. **Implement and Verify**: Write the fix and write a failing test case that now passes.

## Common Error Patterns to Watch For:
- Off-by-one errors in loop boundaries.
- Null pointer exceptions or undefined references.
- Race conditions in asynchronous code.
- Incorrect API payloads or malformed JSON.
- Memory leaks from unclosed streams or lingering event listeners.

## Example Workflow
1. User provides: \`TypeError: Cannot read properties of undefined (reading 'map')\`
2. Agent traces the variable back to its source.
3. Agent discovers an API response changed its schema.
4. Agent proposes fixing the schema interface and adding optional chaining.

Always ensure your code is cleanly formatted and well-documented.`
    ),
    makeSkill(
      superpowers,
      "brainstorming",
      "brainstorming",
      "Explores user intent, requirements and design before implementation.",
      "valid",
      "codex",
      `# Brainstorming Agent

You are a creative and analytical brainstorming assistant. Your role is to explore user intent, break down requirements, and architect high-level designs *before* any implementation begins.

## Phase 1: Empathy & Intent Gathering
- Ask clarifying questions about the target audience.
- Understand the business or personal goals behind the project.
- Identify the core "Job To Be Done".

## Phase 2: Divergent Thinking
- Generate at least 5 radically different approaches to solving the problem.
- Do not constrain yourself by technical limitations in this phase.
- Include one "moonshot" idea that rethinks the paradigm entirely.

## Phase 3: Convergent Thinking & Architecture
- Work with the user to select the best approach.
- Draft a high-level system architecture (frontend, backend, database).
- Outline the Minimum Viable Product (MVP) features.
- Define out-of-scope items (what we will NOT build right now).

## Output Formatting
Always use clear headings, bullet points, and markdown tables when comparing options. Provide concrete examples for abstract concepts.

### Example Interaction
**User**: "I want to build a habit tracker."
**Agent**: "Great! Let's explore. Is this for personal use, or a SaaS product? Should it focus on streaks, gamification, or data analytics? Here are 3 distinct directions we could take..."

Remember: The best code is the code you don't have to write because the design was well thought out.`
    ),
    makeSkill(
      claude,
      "documentation-lookup",
      "documentation-lookup",
      "Fetches current documentation when code depends on external libraries.",
      "warning",
      "claude",
      "Fetches current documentation when code depends on external libraries.",
      "No markdown heading or frontmatter name was found.",
    ),
    makeSkill(
      gemini,
      "gemini-executor",
      "gemini-executor",
      "Runs Gemini-focused workflows and shared agent tasks.",
      "valid",
      "gemini",
      "# gemini-executor\n\nRuns Gemini-focused workflows and shared agent tasks.",
    ),
    makeSkill(
      opencode,
      "opencode-bootstrap",
      "opencode-bootstrap",
      "Bootstraps OpenCode-specific workspace conventions.",
      "valid",
      "opencode",
      "# opencode-bootstrap\n\nBootstraps OpenCode-specific workspace conventions.",
    ),
    ...customSources.map((source, index) =>
      makeSkill(
        source,
        `Imported Skill ${index + 1}`,
        `imported-skill-${index + 1}`,
        "Imported from a custom folder added by the user.",
        "valid",
        "unknown",
        `# Imported Skill ${index + 1}\n\nImported from a custom folder added by the user.`,
      ),
    ),
  ];

  return { sources, skills };
}
