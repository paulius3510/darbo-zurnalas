# CLAUDE.md and README Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a project-level `CLAUDE.md` so future Claude sessions skip the re-explanation tax, and apply five targeted edits to `README.md` to remove drift.

**Architecture:** Pure documentation. Two files written/edited at the repo root. No source code under `src/` is touched. All work bundled into a single conventional commit at the end (per user instruction "no auto-commit, bundled deliverable").

**Tech Stack:** Markdown only. Verification uses `wc -l`, `ls`, and `grep`.

**Spec:** `docs/superpowers/specs/2026-05-06-claude-md-and-docs-cleanup-design.md`

---

## File map

- **Create:** `CLAUDE.md` (repo root, ~70-110 lines, English)
- **Modify:** `README.md` (5 targeted edits, no restructuring, stays Lithuanian)
- **Untouched:** `CLAUDE_IMPORT_TEMPLATE.md`, anything under `src/`, the spec doc itself

---

### Task 1: Write `CLAUDE.md`

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write the file**

Write the following content verbatim to `CLAUDE.md` at the repo root:

````markdown
# Darbo Žurnalas — Claude Project Guide

## TL;DR

- **Domain:** solo dev, tile-laying business in Iceland. UI in Icelandic
  (Verkefnaskrá, Vinnustundir, Efni); currency ISK (Islandic kronur).
- **Stack:** React 18 + TypeScript + Vite + Firebase 12 PWA, deployed to
  GitHub Pages.
- **Production:** https://paulius3510.github.io/darbo-zurnalas/
- **Firebase project ID:** `darbo-zurnalas-59881` (Spark / no-cost tier)
- **`isPublic` is opt-in:** projects are private by default; the public
  invoice link (`?v=<id>`) only resolves when the owner enables `isPublic`
  via the Edit Project modal.
- **Deploy Firestore rules via CLI** (`npm run deploy:rules`), never paste
  into Firebase Console — the local file is the source of truth.
- **Never auto-commit or auto-push.** Wait for an explicit user request.

## Stack

- React 18.3, TypeScript 5.9, Vite 6, Tailwind 3.4, lucide-react icons
- Firebase 12: Auth (Google provider only), Firestore configured with
  `persistentLocalCache` + `persistentMultipleTabManager` (multi-tab
  offline support)
- `gh-pages` for the frontend deploy, `firebase-tools` (devDep) for
  Firestore rules and indexes deploy

## Architecture

```
src/main.tsx              bootstrap + service-worker registration
src/App.tsx               thin wrapper, renders WorkHoursJournal
src/WorkHoursJournal.tsx  ~1000-line monolith: list view, project detail,
                          public invoice view, all modals. Intentionally
                          single-file for now; do NOT split unless asked.
src/firebase.ts           Firebase init + Firestore cache configuration
src/api/firebaseAPI.ts    sole CRUD wrapper around Firestore; type
                          definitions for Project / WorkEntry /
                          MaterialEntry / PublicProjectData live here
```

Three top-level Firestore collections: `projects`, `workEntries`,
`materials`. Document IDs come from `Math.random().toString(36).substr(2, 9)`
— not crypto-secure; accepted tradeoff (private-by-default mitigates
ID-guessing risk).

## Commands

- `npm run dev` — Vite dev server at `http://localhost:5173/darbo-zurnalas/`
- `npm run build` — production bundle into `dist/`
- `npm run preview` — serve the built bundle locally
- `npm run deploy` — build + push `dist/` to the `gh-pages` branch (frontend)
- `npm run deploy:rules` — push `firestore.rules` to the live project
- `npm run deploy:indexes` — push `firestore.indexes.json`
- `npm run deploy:firestore` — both rules and indexes
- `npm run emulators` — local Firestore + Auth + UI on ports 8080 / 9099 / 4000

## Firebase Specifics

- Project ID `darbo-zurnalas-59881` (set in `.firebaserc`)
- Spark (no-cost) tier — watch read budget when changing query patterns
- Auth: Google provider only (`signInWithPopup`)
- Firestore rules helpers (`firestore.rules`):
  - `isOwner(data)` — `request.auth.uid == data.uid`
  - `isProjectPublic(projectId)` — `get()` lookup; true only if the parent
    project's `isPublic == true`
- Public invoice flow:
  - URL parameter is `?v=<projectId>` (handled in `WorkHoursJournal.tsx`)
  - Owner toggles `isPublic` via the Edit Project modal checkbox
  - Reads of `workEntries` / `materials` for unauthenticated viewers
    require the parent project's `isPublic == true`; rules enforce this
    via `get()` lookup, cached per request

## Known Quirks & Tradeoffs

- **`main.tsx:27` has a pre-existing TS error** (`getElementById` returns
  `HTMLElement | null`). Vite ignores it for the build. Do NOT fix unless
  explicitly asked.
- **`WorkHoursJournal.tsx` is ~1000 lines** and intentionally monolithic.
  A refactor sits on the backlog; do NOT split it unless explicitly asked.
- **Math.random IDs are not crypto-secure** but accepted. The
  private-by-default `isPublic` flag mitigates ID-guessing risk. Don't
  switch to `crypto.randomUUID()` unsolicited.
- **5 npm-audit vulnerabilities** are transitive deps of `firebase-tools`
  (devDep only); they do not ship in the production bundle.
- **Bundle is ~728 KB / ~185 KB gzip.** Code-splitting / `manualChunks`
  is on the backlog; ignore the Vite size warning.
- **Do NOT reintroduce `enableIndexedDbPersistence`** — migrated to
  `persistentLocalCache` for Firebase v12 deprecation. The new API is
  synchronous and applied at init.
- **Firestore `read` rules combine owner + public path with `||`.** List
  queries must include a `where` clause that satisfies one branch
  (`where('uid', '==', uid)` for the owner, or
  `where('projectId', '==', publicId)` for a public viewer) — otherwise
  Firestore rejects the query.
- **`README.md`'s project structure tree may lag reality** after
  infrastructure changes. Verify with `ls` / `find` before trusting it.
````

- [ ] **Step 2: Verify line count is in target range**

Run: `wc -l CLAUDE.md`
Expected: a number between 70 and 110 inclusive.

- [ ] **Step 3: Verify required TL;DR facts are present**

Run: `grep -c -E "darbo-zurnalas-59881|isPublic|deploy:rules|auto-commit" CLAUDE.md`
Expected: `4` or higher (each anchor at least once).

---

### Task 2: Apply five `README.md` edits

**Files:**
- Modify: `README.md` (5 locations)

Apply edits in the order below. Line numbers refer to the file state
*before* edit #1; subsequent edits target text content (not line numbers),
so order does not matter for correctness but is fixed here for clarity.

- [ ] **Step 1: Edit #1 — drop the Icelandic fragment from the materials bullet (line 13)**

Replace exactly:

```
- Medžiagų/efnių sekimas (data, pavadinimas, kiekis, kaina)
```

with:

```
- Medžiagų sekimas (data, pavadinimas, kiekis, kaina)
```

- [ ] **Step 2: Edit #2 — note the `isPublic` opt-in on the Public Invoice bullet (line 16)**

Replace exactly:

```
- Public Invoice nuoroda klientui (dalintis per SMS/email)
```

with:

```
- Public Invoice nuoroda klientui per `isPublic` jungiklį (dalintis per SMS/email)
```

- [ ] **Step 3: Edit #3 — append a Firebase CLI note after the Installation block**

Find the closing fence of the Installation code block:

````
```bash
git clone https://github.com/paulius3510/darbo-zurnalas.git
cd darbo-zurnalas
npm install
npm run dev
```
````

Replace with:

````
```bash
git clone https://github.com/paulius3510/darbo-zurnalas.git
cd darbo-zurnalas
npm install
npm run dev
```

Pirmą kartą diegiant Firebase rules ar indexes — prisijunk prie Firebase CLI ir naudok deploy komandas:

```bash
npx firebase login
npm run deploy:rules
```
````

- [ ] **Step 4: Edit #4 — expand Firebase Setup step 5 with CLI guidance**

Replace exactly:

```
5. Nustatyti Firestore security rules (žr. `firestore.rules`)
```

with:

````
5. Nustatyti Firestore security rules — failas `firestore.rules` deploy'inamas per Firebase CLI:

   ```bash
   npm run deploy:rules
   ```

   Nereikia kopijuoti rankomis į Firebase Console.
````

- [ ] **Step 5: Edit #5 — refresh the Projekto Struktūra tree**

Replace exactly:

````
```
darbo-zurnalas/
├── index.html
├── firestore.rules
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── WorkHoursJournal.tsx
│   ├── firebase.ts
│   ├── index.css
│   └── api/
│       └── firebaseAPI.ts
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon.svg
│   └── icons/
```
````

with:

````
```
darbo-zurnalas/
├── index.html
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── WorkHoursJournal.tsx
│   ├── firebase.ts
│   ├── index.css
│   └── api/
│       └── firebaseAPI.ts
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── favicon.png
│   └── icons/
```
````

---

### Task 3: Verify and commit

**Files:**
- Stage: `CLAUDE.md`, `README.md`,
  `docs/superpowers/specs/2026-05-06-claude-md-and-docs-cleanup-design.md`,
  `docs/superpowers/plans/2026-05-06-claude-md-and-docs-cleanup.md`

- [ ] **Step 1: Verify the README tree matches the filesystem**

Run:
```bash
ls -A | grep -E '^(firebase\.json|\.firebaserc|firestore\.indexes\.json|firestore\.rules|index\.html)$'
ls public/
```
Expected:
- The first command lists all five files (`firebase.json`, `.firebaserc`,
  `firestore.indexes.json`, `firestore.rules`, `index.html`).
- `public/` contains `favicon.png` (not `icon.svg`), plus `manifest.json`,
  `sw.js`, and `icons/`.

If reality has drifted, update `README.md`'s tree to match before
committing.

- [ ] **Step 2: Verify `isPublic` is mentioned exactly once in the Funkcionalumas section**

Run: `grep -c "isPublic" README.md`
Expected: `1`

- [ ] **Step 3: Verify no other source code was touched**

Run: `git status --short`
Expected: only `CLAUDE.md` (new), `README.md` (modified), and the two
files under `docs/superpowers/` (new). Nothing under `src/`, `public/`,
`scripts/`, or top-level config files (`package.json`, `vite.config.js`,
etc.) should appear.

- [ ] **Step 4: Stage and commit**

Run:
```bash
git add CLAUDE.md README.md docs/superpowers/specs/2026-05-06-claude-md-and-docs-cleanup-design.md docs/superpowers/plans/2026-05-06-claude-md-and-docs-cleanup.md
git commit -m "$(cat <<'EOF'
docs: add CLAUDE.md and refresh README

Add a project-level CLAUDE.md so future Claude sessions skip the
re-explanation tax (Firebase project ID, isPublic semantics, monolithic
WorkHoursJournal, accepted tradeoffs). Apply five targeted edits to
README.md: refresh the project structure tree, note that Firestore rules
are deployed via the new CLI pipeline, mention the isPublic opt-in next
to the Public Invoice bullet, and drop a leftover IS-language fragment.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify the commit**

Run: `git log -1 --stat`
Expected: a single new commit including the four files listed in Step 4.
Working tree is clean (`git status` shows no further changes outside of
`.claude/`).
