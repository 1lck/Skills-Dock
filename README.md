# Skills Dock

Skills Dock is a desktop app for managing local AI skills across multiple coding tools.

It is built with `Tauri + React + TypeScript + Rust`, and the current MVP focuses on local skill discovery and management on macOS. The app is designed so it can expand to Windows 11 later.

## What it does today

The current build can:

- scan local skill directories for Codex, Claude, Gemini, and OpenCode
- support custom skill folders
- show installed skills in a desktop-friendly list
- aggregate one skill across multiple apps into a single row
- show per-app install state for Claude, Codex, Gemini, and OpenCode
- toggle app install state by copying or removing the skill directory in the target app
- preview `SKILL.md`, validation status, installation locations, and content differences

## What it does not do yet

The current MVP does not include:

- a remote skill marketplace
- ZIP import flow
- in-app skill editing
- sync, accounts, or cloud storage

## Understand the two dev modes

There are two ways to run the project, and they are not equivalent.

### Use the browser preview for UI work

Run:

```bash
npm run dev
```

This is useful for:

- layout
- styling
- component interaction

It uses demo data. It does **not** scan your real machine.

### Use the desktop app for real behavior

Run:

```bash
npm run tauri dev
```

Use this when you want to verify:

- local directory scanning
- symlinked skill directories
- open file and open folder actions
- per-app install toggles
- real counts from your machine

If you only use `npm run dev`, the app will show a banner explaining that it is using demo data.

## Local directories the app knows about

The desktop app currently resolves these built-in locations:

- `~/.codex/skills`
- `~/.codex/superpowers/skills`
- `~/.claude/skills`
- `~/.gemini/skills`
- `~/.opencode/skills`

It also supports custom local folders that you add from the UI.

## Prerequisites

You need:

- Node.js
- npm
- Rust
- Cargo
- Xcode or Xcode Command Line Tools on macOS

If `xcode-select -p` returns a valid Xcode path, your macOS toolchain is set up correctly for Tauri development.

## Install dependencies

Run:

```bash
npm install
```

## Common commands

Run the browser dev server:

```bash
npm run dev
```

Run the desktop app:

```bash
npm run tauri dev
```

Run tests:

```bash
npm run test
```

Build the frontend bundle:

```bash
npm run build
```

Check the Rust side:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

Run Rust tests:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

## Project structure

The important parts of the repo are:

- `src/`
  The React app, including layout, list views, detail views, and hooks
- `src-tauri/`
  The Rust command layer for scanning, validation, file operations, and app install toggles
- `docs/superpowers/specs/`
  Design notes for the MVP
- `docs/superpowers/plans/`
  Implementation plan used to build the current version

## Current UI model

The app currently uses a three-panel layout:

- **Sources**
  Built-in and custom skill roots
- **Installed Skills**
  One row per skill, aggregated across apps
- **Skill Detail**
  Installation locations, validation results, and `SKILL.md` preview

The installed skills list is intentionally compact. It shows the skill title, validation state, and app-level install status without repeating the full description in every row.

## Current scan behavior

The Rust scanner:

- detects directories that contain `SKILL.md`
- follows symlinked skill directories
- extracts a name from frontmatter or markdown headings
- computes validation status
- hashes content so installation differences can be compared

This matters for tools like Claude Code, where installed skills may be symlinked from another location such as `~/.cc-switch/skills`.

## Current status

The project already has:

- a working desktop scaffold
- tested scan and aggregation logic
- tested app install toggling logic
- GitHub repo initialization on `main`

The next likely steps are:

- ZIP import
- “import existing” flow
- clearer source grouping and counting rules
- better settings for `copy` vs. `symlink` install strategy
