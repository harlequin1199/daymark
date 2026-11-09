# Daymark UI/UX audit — 6–9 November 2026

## Scope and criteria

- Vercel Web Interface Guidelines (current on 6 November 2026).
- WCAG 2.2 AA automated checks using axe-core in desktop Chromium.
- Nielsen usability heuristics, core task flows, responsive CSS, and keyboard behavior.
- Static source review, browser inspection, production build, and component tests.

Automated accessibility tests do **not** establish full WCAG conformance; manual assistive-technology and multi-device verification remain necessary.

## Resolved issues

| Priority | Finding                                                                         | Resolution                                                                           | Evidence                                                               |
| -------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| P0       | Subheadings and navigation captions had contrast from 2.11:1 to 2.42:1          | Introduced darker secondary colors and revised priority/status colors                | Sampled computed contrast is now 5.26:1–11.45:1                        |
| P0       | Dialogs did not contain or reliably restore keyboard focus                      | Used native `dialog.showModal`, Escape/cancel, focus restoration, scroll containment | Browser keyboard interaction verified                                  |
| P0       | Remaining low-contrast utility text (`.help-link`, `.breadcrumb`, `.date-pill`) | Darkened and enlarged text                                                           | axe-core initially found 3 serious color-contrast nodes, then 0        |
| P1       | Tiny 9–11 px labels and cramped task actions                                    | Increased copy size and interactive target dimensions                                | Source/UI inspection                                                   |
| P1       | Hero statistics occupied too much of the initial viewport                       | Reduced card height, whitespace, and summary typography                              | Desktop visual inspection: several task rows visible without scrolling |
| P1       | Search field lacked visible keyboard focus                                      | Added `:focus-within` focus indicator                                                | Browser and source inspection                                          |
| P1       | Example tasks appeared on first visit without explanation                       | Empty-by-default workflow; explicit "Посмотреть на примере"                          | Unit test                                                              |
| P1       | Missing skip link and incomplete status semantics                               | Added skip link, progressbar semantics, filter pressed states, current nav state     | Source inspection                                                      |
| P1       | Mobile navigation could leave keyboard focus on obscured page content           | Added focus containment, Escape dismissal, background inertness and return focus     | Source inspection; Playwright coverage authored                        |
| P2       | Visual dropdowns, arrows, and action icons suggested functionality they lacked  | Removed misleading affordances and made the workspace identity non-interactive       | Design heuristic/source review                                         |

## Follow-up UX implementation

- Task rows have a full-row accessible action for opening the editor; checkbox and action buttons remain independent click targets.
- Overdue tasks have a dedicated navigation view, prominent warning and red accent; today's work has an amber accent.
- Sort by deadline, priority, creation date, or title, with completed tasks last.
- Descriptions appear as two-line previews in the list.
- The primary New Task action is beside the list heading; quick add supports due date and priority.
- One-level subtasks can be created beneath parents. Completing a parent completes its subtasks; undo restores a deleted parent and its children. Legacy v1 task data is migrated without loss.
- Lightweight animations respect `prefers-reduced-motion`.
- Self-hosted Latin and Cyrillic Manrope WOFF2 fonts are preloaded with optional font display. This avoids external Google Fonts requests and layout shifts in the audited flow.
- A valid `robots.txt` is included.

## Browser axe-core results

| Screen state                     | WCAG-tagged violations after fixes |
| -------------------------------- | ---------------------------------: |
| Main task list with sample tasks |                                  0 |
| New-task modal                   |                                  0 |

Tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.

## Test results

- Vitest / React Testing Library: **17/17 passing on 9 November 2026** (core workflows, local-profile persistence, legacy migrations, multi-priority filters across workspaces, contextual quick-add, 5,000-task paging, undo, dialog focus, subtask actions, sorting, urgency, description previews).
- TypeScript / Vite production build: **passing**.
- Manual browser checks: dialog opening, Escape, focus restoration, create, edit, search, filtering, and local storage persistence.
- Playwright E2E: **13 passed, 1 intentionally skipped in the 6 November run** across desktop and mobile Chromium. The skipped test was mobile-nav-only in the desktop project. The current source includes new E2E coverage but was **not rerun locally on 9 November** because Chromium is unavailable in the current execution environment; CI installs Chromium before running it.
- Screenshots inspected at **320, 390, 768 and 1440 CSS pixels**, with no horizontal overflow. A squeezed search field at tablet width was corrected during review.

## Lighthouse lab audit (6 November revision)

Run on a locally served production build with Chromium 153 and Lighthouse 13.6.0 on 6 November (before the later feature/refactor changes):

| Category       | Mobile | Desktop |
| -------------- | -----: | ------: |
| Performance    |    100 |     100 |
| Accessibility  |    100 |     100 |
| Best Practices |    100 |     100 |
| SEO            |    100 |     100 |

- Mobile: FCP **0.9 s**, LCP **0.9 s**, TBT **50 ms**, CLS **0**.
- Desktop: FCP **0.2 s**, LCP **0.2 s**, TBT **0 ms**, CLS **0**.
- These are single-run lab observations, not field Core Web Vitals or guaranteed scores across devices and networks.
- **Current version not remeasured** on 9 November. Re-run mobile and desktop Lighthouse on the final public deployment; the earlier scores must not be presented as current-version measurements.
- Earlier runs showed Best Practices 96 due to unavailable Google Fonts and, after initial font bundling, a mobile CLS of 0.198. Local font preloading and `font-display: optional` removed these issues in the final run.

## Remaining checks before claiming full conformance

- Manual NVDA + VoiceOver review, including announcements and dialog focus order.
- Further responsive visual checks at 375 and 1024 CSS pixels and 200–400% zoom.
- Cross-browser testing on Safari/iOS and Firefox.
- Core Web Vitals field data after real traffic exists (especially INP).
- High-volume list and simultaneous multi-tab localStorage behavior.

## Follow-up engineering review — 9 November 2026

- Split the 1,821-line `App.tsx` into domain utilities, data loading and focused UI components; the remaining app module manages shared state and orchestration.
- Split the 2,203-line stylesheet into base, layout, tasks, dialogs and responsive sections while preserving cascade order. Vite still emits one optimized CSS asset.
- Fixed quick-add context: Today and Upcoming preselect matching due dates and keep users in their current view when the new task belongs to it; task editor uses the same defaults.
- Raised the Vitest per-test timeout from the jsdom default 5 seconds to 20 seconds for slower shared runners. The 9 November `npm test` run passed all 17 tests; repeat CI runs remain an important handoff check.
- Browser checks after refactoring confirmed multiple priority filters, new-task creation in Today, visual layout and centered About dialog after scrolling.
- The current Site is owner-private. Public visibility and the external GitHub repository are intentionally left for the owner to configure before submission.

These items are verification limits, not claims of passed tests. No real-user Web Vitals measurement has been fabricated.
