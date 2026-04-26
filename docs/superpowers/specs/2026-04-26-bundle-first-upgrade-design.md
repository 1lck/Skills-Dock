# Skills Dock Bundle-First Upgrade Design

## Summary

Upgrade Skills Dock from a skill-only inventory to a bundle-first inventory while keeping the current local scan and per-skill install flows intact.

## Goals

- Introduce a bundle layer above individual skills.
- Group known workflow packs like `superpowers` into one bundle.
- Keep standalone skills in app install roots working as single-skill bundles.
- Update the UI so the main list and detail panel operate on bundles first.

## Non-Goals

- No Git source sync in this phase.
- No manifest or lockfile persistence in this phase.
- No Rust scan protocol changes in this phase.

## Grouping Rules

1. If a source root clearly represents a bundle root such as `.../superpowers/skills`, group all child skills under that bundle.
2. If a custom root is a named package directory rather than a generic `skills` folder, group all child skills under that root.
3. Otherwise, treat each aggregated skill as its own single-skill bundle.

## Architecture

- Keep Rust scanning unchanged and continue returning `SkillSnapshot`.
- Add TypeScript application-layer bundle aggregation on top of aggregated installed skills.
- Drive the Skills view from bundle records.
- Keep install, export, and usage actions operating on member skills under each bundle.

## UX Changes

- The main list shows bundles, member count, preview, health, app coverage, and usage totals.
- The detail panel shows bundle metadata, member skills, and previews the primary member `SKILL.md`.
- Existing install/export actions fan out to all member skills in the selected bundle.
