# Skills Dock Local Bundle Integration Design

## Summary

Add local-only bundle integration so users can organize installed skills into their own named bundles without depending on any marketplace or remote source.

## Goals

- Persist user-defined bundle definitions locally.
- Allow creating a custom bundle from selected existing bundles.
- Show custom bundles alongside source-derived bundles in the main list.
- Keep installation and export actions working through existing per-skill commands.

## Non-Goals

- No remote catalog or marketplace integration.
- No Rust-side persistence changes.
- No advanced bundle editor, rename flow, or drag-and-drop in this phase.

## Data Model

- `CustomBundleDefinition`
  - `id`
  - `name`
  - `memberSkillIds`
  - `createdAt`
  - `updatedAt`

## UX

- Users select one or more bundles in the Skills page.
- Clicking `整合为本地包` creates a new local bundle using all member skills from the selected bundles.
- The new bundle appears in the main bundle list with grouping kind `custom`.

## Architecture

- Persist bundle definitions in browser-safe storage beside existing custom source settings.
- Build custom bundles in TypeScript by overlaying stored definitions onto the existing aggregated bundle list.
- Do not remove source-derived bundles yet; custom bundles are additive in this phase.
