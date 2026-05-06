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
