# Daymark — personal task planner

A calm, responsive personal to-do app concept built with React, TypeScript, Vite, and Lucide.

## Features

- Create, edit, complete, and delete tasks, with undo for deletion.
- Create one-level subtasks beneath a parent task. Completing a parent completes its subtasks; deleting the parent removes its subtasks with one-step undo.
- Search, filter by status, sort by date / priority / creation / name, and navigate Today / Upcoming / Overdue / Completed.
- Assign priorities, due dates, and optional descriptions.
- Preview descriptions in the list, open the editor by clicking the task row, and spot overdue deadlines at a glance.
- Quickly add tasks with priority and due date without opening a dialog.
- Quick-add inherits today's date in Today and tomorrow's date in Upcoming, and keeps the current view when the new task belongs there.
- Live completion metrics and responsive dashboard.
- Multiple local profiles with optional remembered names and independent task lists; switch profiles from the sidebar without signing in.
- Store tasks locally, with validation of restored state and storage-error feedback.
- Keyboard-friendly forms and support for reduced-motion preferences.
- Accessible native dialogs with focus containment, Escape and focus restoration.
- Accessible mobile navigation that contains keyboard focus and makes the page behind it inert while open.
- Self-hosted variable Manrope typeface with Latin and Cyrillic subsets; no font CDN dependency.

## Run locally

```bash
npm install
npm run dev
```

Build with `npm run build`.

## Project structure

- `src/domain/tasks.ts` — task types, validation, date utilities, sorting and sample data.
- `src/lib/taskStorage.ts` and `src/lib/profiles.ts` — persistence, legacy migrations and local profile registry.
- `src/components/` — isolated sidebar, calendar, task list rows, filters, quick-add form and accessible dialogs.
- `src/styles/` — base styles, layout, task controls, dialogs and responsive overrides, combined into a single production stylesheet.
- `src/App.tsx` — shared application state, derived selectors and orchestration.
- `src/test/` and `e2e/` — component and browser regression coverage.

## Quality checks

```bash
npm test
npm run build
npm run test:e2e
```

Component tests use Vitest and React Testing Library. Playwright E2E tests cover key flows, nested tasks, overdue status, keyboard dialogs, viewport overflow, and axe-core checks (requires Chromium installed with `npx playwright install chromium`). The final command starts a local dev server; when one is already running, set `E2E_BASE_URL` to its origin. For custom Chromium builds, set `CHROMIUM_PATH` to the executable path.

The test runner uses a 20-second per-test timeout for interaction-heavy jsdom tests on shared CI workers. The default `npm test` command, without any custom flags, is used by GitHub Actions.

See [UI/UX audit](docs/ui-ux-audit.md) for reviewed issues, measured contrast, and verification limits.

## Prototype notes

The first visit opens with an empty task list; sample tasks can be added explicitly from the empty state. Subsequent visits restore the same browser's task list from `localStorage`. Existing users retain their original tasks in `daymark:tasks:v1` under the default profile, and their optional name is migrated from `daymark:profile:v1`. New profiles are registered in `daymark:profiles:v1` and use separate namespaced task keys. Task lists without `parentId` are migrated automatically; this field is intentionally limited to one nesting level. These are **local profiles**, not authenticated cloud accounts: there is no cross-device synchronization, server storage, or public API.

Task lists render an initial 40 rows, with explicit “Show more” increments. Filtering and sorting still process the in-memory list, so very large datasets and simultaneous edits from multiple browser tabs warrant additional testing; localStorage uses last-writer-wins semantics.

## AI-assisted workflow

- Product scope and interface direction were discussed with ChatGPT.
- Source code and styles were developed with ChatGPT assistance.
- The build and interactive scenarios were reviewed and tested in a browser; a `crypto.randomUUID` preview compatibility issue was found and corrected.
- The interface was audited against the Vercel Web Interface Guidelines and WCAG 2.2 AA success criteria, followed by browser-based axe-core scans and accessibility fixes.
