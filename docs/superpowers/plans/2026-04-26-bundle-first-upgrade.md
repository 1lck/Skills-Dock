# Bundle-First Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bundle-first application layer and UI without changing the Rust scan contract.

**Architecture:** Keep `SkillSnapshot` as the scan output, aggregate installed skills as before, then build bundle records in TypeScript using source-root heuristics. Update the main list, selection state, and detail panel to operate on bundles while reusing per-skill install/export operations internally.

**Tech Stack:** React, TypeScript, Vitest, Testing Library

---
