# Skills Dock MVP Design

## Summary

Skills Dock is a desktop application for managing local AI skills on macOS first, with future Windows 11 support. The MVP focuses on local skill discovery and management only. It does not include a remote marketplace, online installation, account systems, or cloud sync.

The application will use Tauri with a React and TypeScript frontend plus a Rust system layer. The product should support multiple tool ecosystems instead of binding itself to a single IDE or agent runtime.

## Product Goals

- Provide one desktop UI for browsing and managing local skills across multiple tool ecosystems.
- Make local skill directories easier to inspect, validate, and organize.
- Support known tool sources such as Codex and Claude, plus arbitrary user-added folders.
- Keep the architecture ready for a future remote marketplace without requiring a rewrite.

## Non-Goals

- Remote skill marketplace
- Online download or installation flows
- AI-generated summaries, translation, or content normalization
- User accounts, sync, or cloud storage
- Rich in-app skill editing

## Target Users

- Developers and AI power users who maintain local skill libraries
- Users working across more than one agent or IDE environment
- Users who need to audit local skill quality and source paths quickly

## Supported Platforms

### MVP

- macOS

### Planned Later

- Windows 11

The core application logic must avoid hard-coding macOS-specific assumptions except where required by current platform integration.

## Core User Problems

Users currently manage skills through folders and markdown files spread across different local locations. This makes it hard to:

- know what skills exist
- search across sources quickly
- identify invalid or broken skills
- inspect file paths and source locations
- manage custom folders alongside tool-specific built-in directories

## User Outcomes

The MVP is successful if a user can:

1. Launch the app and see skills from known local sources.
2. Add one or more custom folders and have valid skills indexed automatically.
3. Search and filter skills across all sources.
4. Open a skill and understand its contents, source, and health status.
5. Identify and fix broken skills using path and validation feedback.

## Technical Stack

- Desktop shell: Tauri
- Frontend: React
- Language: TypeScript
- System layer: Rust

This stack is chosen because it balances UI flexibility, local file-system access, packaging efficiency, and future Windows support.

## Product Scope

### Included in MVP

- Detect known built-in source directories for supported tools
- Allow users to add arbitrary local folders as additional sources
- Scan for local skills using conservative detection rules
- Display skills in a searchable list
- Filter by source and validation status
- Sort by update time and name
- Render skill detail content from `SKILL.md`
- Show source path, skill path, detected format, and validation issues
- Open a skill or source in the system file manager
- Refresh indexing manually

### Excluded from MVP

- Editing skill content in-app
- Creating new skills from templates
- Bulk migration between tools
- Any network-backed catalog behavior

## Information Architecture

The application uses a single-window desktop layout with three persistent regions.

### Left Column: Sources

Purpose:

- Show all configured source entries
- Separate built-in tool sources from user-added folders
- Give users source-level controls

Actions:

- Add folder
- Remove custom source
- Refresh one source
- Show source state such as ready, empty, warning, or unavailable

### Middle Column: Skills List

Purpose:

- Show all indexed skills from the active filter context

Capabilities:

- Search by name and preview text
- Filter by tool kind
- Filter by validation status
- Sort by update time or alphabetical order
- Show compact status indicators

### Right Column: Skill Detail

Purpose:

- Let the user inspect a selected skill without leaving the app

Content:

- Name and source
- Validation result
- Key paths
- Detected format
- `SKILL.md` preview or full markdown rendering
- Related files if present
- Actions to reveal files in the system file manager

## Domain Model

The UI should not care whether a skill came from Codex, Claude, or a generic folder. It should operate on unified source and skill models.

### Source

Fields:

- `id`: stable identifier
- `name`: user-facing source name
- `toolKind`: `codex`, `claude`, or `generic`
- `sourceType`: `builtin` or `custom`
- `rootPath`: absolute root path
- `platformRules`: optional adapter metadata for platform-aware defaults
- `status`: `ready`, `empty`, `warning`, `missing`, or `unavailable`
- `lastIndexedAt`

### SkillSummary

Fields:

- `id`: stable identifier derived from source and relative path
- `name`
- `toolKind`
- `sourceId`
- `sourcePath`
- `skillPath`
- `skillFilePath`
- `detectedFormat`
- `compatibility`
- `status`: `valid`, `warning`, or `invalid`
- `issues`
- `preview`
- `updatedAt`

### SkillDetail

Extends `SkillSummary` with:

- `content`: rendered or raw markdown payload from `SKILL.md`
- `relatedFiles`
- `frontmatter` or parsed headings if available

## Source Strategy

The MVP supports three source classes:

1. Codex built-in sources
2. Claude built-in sources
3. Generic user-added folders

Known tool sources are handled through adapters that define:

- default source paths by platform
- scan hints if structure is partially known
- compatibility labels for display

Generic folders use the shared scanner and only receive minimal structural inference.

## Scanning Rules

The scanner should be conservative. A directory is treated as a candidate skill if it contains a `SKILL.md` file.

Rules:

1. If a directory contains `SKILL.md`, index it as a candidate skill.
2. If `SKILL.md` is unreadable or missing after detection, keep the entry but mark it invalid.
3. Do not infer complex metadata unless it is clearly present.
4. For known source adapters, enrich results with tool-specific hints only where low-risk.

This avoids overfitting the MVP to one ecosystem and reduces false positives.

## Validation Strategy

Validation is informational, not blocking.

Initial checks:

- `SKILL.md` exists
- `SKILL.md` is readable
- skill directory exists
- source path exists
- duplicate skill identifier collision
- title or basic content can be extracted

Statuses:

- `valid`: expected structure is readable
- `warning`: partially usable but unusual or incomplete
- `invalid`: missing or unreadable core content

## Application Architecture

The system should be organized in three layers.

### UI Layer

Implemented in React.

Responsibilities:

- rendering layout and state
- user interactions
- search and filter controls
- detail presentation

The UI must not directly access the file system.

### Application Layer

Implemented in TypeScript.

Responsibilities:

- orchestrating scans and refreshes
- managing selected source and selected skill
- applying search, filter, and sort behavior
- normalizing data returned from the system layer

This layer is the future integration point for remote providers.

### System Layer

Implemented in Rust through Tauri commands.

Responsibilities:

- enumerating configured source paths
- reading directories and files
- validating local paths
- opening locations in the system file manager
- optionally watching file changes later

## Persistence

The MVP needs lightweight local persistence for:

- custom source list
- last selected filters or sort mode

This data should be stored locally using Tauri-friendly app storage. No server persistence is needed.

## Key User Flows

### First Launch

1. App resolves known built-in sources for the current platform.
2. Existing custom sources are loaded from local persistence.
3. App scans available sources.
4. Empty or missing sources are displayed gracefully.

### Add Folder

1. User chooses a local folder via system dialog.
2. App saves the folder as a custom source.
3. Scanner indexes it immediately.
4. Matching skills appear in the list with source attribution.

### Inspect Skill

1. User selects a skill from the list.
2. Detail panel shows content, paths, and validation.
3. User can reveal the file or folder in the system file manager.

### Resolve Broken Skill

1. User filters to warnings or invalid items.
2. Detail panel explains the issue.
3. User opens the path in the system file manager and repairs it manually.
4. User refreshes the source.

## Cross-Platform Constraints

The MVP should be implemented to keep Windows 11 support practical later.

Required constraints:

- no path logic hard-coded to macOS separators or home conventions
- no Finder-specific logic in shared code
- system file-manager actions abstracted behind the system layer
- known built-in source paths defined per platform
- UI labels remain tool-neutral where possible

## Error Handling

The application should avoid modal-heavy failure patterns.

Preferred behavior:

- missing source paths show inline status
- unreadable files show inline validation issues
- scan failures surface per source without breaking the whole app
- unexpected system errors surface in a non-blocking error banner or panel

## Testing Strategy

### Frontend

- component tests for filters, list rendering, and detail states
- application-layer tests for normalization and search/filter behavior

### Rust System Layer

- unit tests for path normalization and scan result mapping
- tests for validation classification

### Integration

- fixture directories representing valid, warning, and invalid skills
- smoke test for source scan and skill detail retrieval

## Future Extension Path

The MVP should leave one clear expansion seam: providers.

Planned later:

- add a remote catalog provider beside local providers
- map remote skills into the same unified domain model
- keep the same list and detail UI
- add install and update actions only when remote behavior is defined

## Open Decisions Resolved For MVP

- Primary platform: macOS
- Future platform target: Windows 11
- Technical stack: Tauri, React, TypeScript, Rust
- Product scope: local skills manager only
- Source scope: Codex, Claude, and generic folders
- Editing scope: read and manage, not full in-app editing

## Delivery Criteria

The MVP is ready when:

- the app launches as a Tauri desktop application
- built-in and custom sources can be indexed
- skills are displayed in a searchable three-column interface
- a selected skill shows preview, paths, and validation state
- invalid skills are visible and diagnosable
- custom sources persist between launches
