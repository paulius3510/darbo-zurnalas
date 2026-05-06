# Design: CLAUDE.md and README cleanup

**Date:** 2026-05-06
**Status:** Approved, ready for implementation plan

## Goal

Stop wasting context every session re-explaining project basics to Claude.
Create a project-level `CLAUDE.md` that captures the non-obvious facts and
tradeoffs Claude cannot infer from code, and clean up README.md drift that
accumulated across recent commits.

## Non-goals

- Restructuring or rewriting README.md
- Translating README.md or `CLAUDE_IMPORT_TEMPLATE.md`
- Touching `CLAUDE_IMPORT_TEMPLATE.md` (separate audience: end-user copies it
  into claude.ai chat for JSON conversion)
- Documenting coding style, conventional commits, or "no auto-commit" — those
  live in the user's global `~/.claude/CLAUDE.md` and apply to every project
- Decision history or per-feature tutorials

## Scope

Two deliverables:

1. **`CLAUDE.md`** — new file at repo root, ~90 lines, English
2. **`README.md`** — five targeted edits, no restructuring

## Part A — `CLAUDE.md`

### Format

- Location: repo root (Claude Code auto-loads it)
- Size: ~90 lines (TL;DR + 5 sections)
- Language: English (technical terms integrate naturally; matches user's global)

### Section outline

```
# Darbo Žurnalas — Claude Project Guide

## TL;DR                              ≈10 lines
Must-read facts: domain, stack one-liner, Firebase project ID, production
URL, isPublic semantic, "rules deploy via CLI", "never auto-commit".

## Stack                              ≈8 lines
React 18.3, TS 5.9, Vite 6, Firebase 12 (Auth: Google only; Firestore:
persistentLocalCache + persistentMultipleTabManager), Tailwind 3.4.

## Architecture                       ≈15 lines
File map: main.tsx → App.tsx → WorkHoursJournal.tsx (~1000 lines,
intentionally monolithic). firebaseAPI.ts as single CRUD wrapper plus
type definitions. Three Firestore collections: projects, workEntries,
materials. IDs via Math.random().toString(36).substr(2, 9) — accepted
tradeoff.

## Commands                           ≈10 lines
- dev / build / preview
- deploy (frontend to gh-pages branch)
- deploy:rules / deploy:indexes / deploy:firestore (Firebase CLI)
- emulators
Each with one-line purpose.

## Firebase Specifics                 ≈15 lines
Project ID darbo-zurnalas-59881, Spark tier. Public invoice flow:
?v=<id> URL, isPublic gate, get() lookup in rules for unauthenticated
readers. Rules helpers: isOwner(), isProjectPublic().

## Known Quirks & Tradeoffs           ≈20 lines
- main.tsx:27 has pre-existing TS error (Vite ignores; do not fix unsolicited)
- WorkHoursJournal.tsx monolithic (~1000 lines; refactor on backlog,
  do not split unsolicited)
- Math.random IDs not crypto-secure (accepted; private-by-default mitigates)
- 5 npm-audit vulns in firebase-tools transitive deps (devDep only,
  not in production bundle)
- Bundle ~728 KB / 185 KB gzip (code-splitting on backlog)
- Do not reintroduce enableIndexedDbPersistence (migrated to
  persistentLocalCache for v12 deprecation)
- README project structure section may lag actual structure — verify
  with ls before trusting
```

### Explicitly excluded from CLAUDE.md

These belong elsewhere or are inherited:

| Excluded | Reason |
|----------|--------|
| Code style, line widths, language preferences | Inherited from `~/.claude/CLAUDE.md` |
| Conventional commits convention | Inherited from `~/.claude/CLAUDE.md` |
| "Don't auto-commit/push" rule | Inherited globally; one reminder in TL;DR for safety |
| Step-by-step tutorials | Lives in README |
| Decision history / "why" deep-dives | Lives in git log + commit messages |
| End-user JSON import format | Lives in `CLAUDE_IMPORT_TEMPLATE.md` |

## Part B — `README.md` cleanup

Five targeted edits. No restructuring, no language change, no removal of
existing content. README stays in Lithuanian.

Line numbers refer to README state *before* any edits in this part. Edits are
independent — applying them in any order produces the same final result.

| # | Location | Change |
|---|----------|--------|
| 1 | Line 13 — Funkcionalumas bullet | "Medžiagų/efnių sekimas" → "Medžiagų sekimas" (drop the IS-language fragment) |
| 2 | Line 16 — Funkcionalumas bullet | Edit existing bullet to indicate the link is opt-in: "Public Invoice nuoroda klientui per `isPublic` jungiklį" |
| 3 | Line 32-38 — Installation block | Append a note after `npm run dev` line: first-time setup needs `firebase login` and rules can then be deployed via `npm run deploy:rules` |
| 4 | Line 56 — Firebase Setup step 5 | Expand: explain that `firestore.rules` should be deployed via CLI (`npm run deploy:rules`), not copy-pasted into Console |
| 5 | Line 71-88 — Projekto Struktūra tree | Update tree: add `firebase.json`, `.firebaserc`, `firestore.indexes.json`; remove non-existent `icon.svg`; add `favicon.png` |

### Explicitly excluded from README cleanup

| Excluded | Reason |
|----------|--------|
| Restructuring sections | Out of scope; current structure is fine |
| Translation to English | Out of scope; user reads LT |
| Rewriting Funkcionalumas list from scratch | Targeted edit only |
| Touching `CLAUDE_IMPORT_TEMPLATE.md` | Separate audience, content is current |

## Success criteria

1. `CLAUDE.md` exists at repo root, between 70 and 110 lines total, in English
2. TL;DR section contains domain, Firebase project ID, `isPublic` semantic, and the "rules via CLI, never Console paste" rule
3. README.md tree matches the actual filesystem (`ls`-verifiable after edits)
4. README.md mentions `isPublic` once in the Funkcionalumas section
5. Work committed in 1-2 conventional commits
6. No changes to source code under `src/` or to `CLAUDE_IMPORT_TEMPLATE.md`

## Open questions

None.

## Out of scope (deferred)

- README restructuring or English translation
- `WorkHoursJournal.tsx` refactor (~1000 lines)
- `crypto.randomUUID()` migration for IDs
- `main.tsx:27` TS error fix
- Bundle size reduction (code splitting)
- `npm audit` vulnerability cleanup
