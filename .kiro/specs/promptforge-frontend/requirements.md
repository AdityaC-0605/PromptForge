# Requirements Document

## Introduction

PromptForge is a full-stack AI prompt optimization tool. This document covers the frontend requirements for the Next.js 15 (App Router) + TailwindCSS + TypeScript application. The frontend provides a landing page for public visitors and a dashboard application for running, monitoring, and reviewing automated prompt optimization runs. The backend is a FastAPI service exposing REST and WebSocket endpoints.

## Glossary

- **App**: The Next.js 15 frontend application
- **Backend**: The FastAPI service running at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- **Run**: A single prompt optimization session — seed prompt → evaluate → score → rewrite loop
- **PromptVersion**: One iteration's prompt text, score, failure breakdown, and optimizer reasoning
- **TestCaseResult**: The output of evaluating a single test case against a prompt
- **ScoreRing**: The SVG circular progress component displaying a run's current score vs target
- **PromptDiff**: The side-by-side line-level diff component comparing two prompt versions
- **AppShell**: The persistent layout wrapper (sidebar + main content) for all authenticated app routes
- **Sidebar**: The fixed left navigation panel within the AppShell
- **RunControlPanel**: The left column of the live run view showing score, iteration, and controls
- **TestCaseFeed**: The live-scrolling list of test case results in the run view
- **SparklineChart**: The small area chart showing score history over iterations
- **FailureBarChart**: The horizontal bar chart showing failure type distribution
- **RunConfigForm**: The form for configuring and launching a new optimization run
- **RunHistoryTable**: The full-width table listing past runs with filters
- **PromptVersionBrowser**: The tabbed interface for browsing all prompt versions of a run
- **Toast**: A transient notification displayed at the bottom-right of the screen
- **DesignToken**: A CSS custom property defined in `tokens.css` used for all colors, radii, and typography
- **MockMode**: A development mode activated by `?mock=true` query param that bypasses API calls

---

## Requirements

### Requirement 1: Design Token System

**User Story:** As a developer, I want a centralized CSS token system, so that the UI is visually consistent and easy to maintain.

#### Acceptance Criteria

1. THE App SHALL define all color, spacing, radius, and typography values as CSS custom properties in `src/styles/tokens.css`.
2. THE App SHALL import `tokens.css` into `globals.css` so tokens are available globally.
3. THE App SHALL use CSS variable references (e.g. `var(--text)`) for all text and background colors — never raw Tailwind color utility classes.
4. THE App SHALL apply font weight `400` for body text and `500` for headings and labels — never `600` or `700`.
5. THE App SHALL use `1px` borders on cards and `0.5px` on dividers.
6. THE App SHALL apply no drop shadows — borders only for depth.
7. THE App SHALL apply no gradients except on the ScoreRing progress arc.

---

### Requirement 2: Root Layout and Font Setup

**User Story:** As a user, I want consistent typography across the app, so that the interface feels polished and readable.

#### Acceptance Criteria

1. THE App SHALL import `Inter` and `JetBrains_Mono` from `next/font/google` in `app/layout.tsx`.
2. THE App SHALL expose Inter as the `--font-sans` CSS variable and JetBrains Mono as `--font-mono` on the `<html>` element.
3. THE App SHALL apply `--font-sans` as the default body font and `--font-mono` for all code, stats, and diff content.
4. THE App SHALL set appropriate `<meta>` tags for charset, viewport, and page title in the root layout.

---

### Requirement 3: Landing Page — Navigation

**User Story:** As a visitor, I want a clear navigation bar, so that I can find key sections and get started quickly.

#### Acceptance Criteria

1. THE Nav SHALL be sticky and apply `backdrop-filter: blur(8px)` with white background at 92% opacity.
2. THE Nav SHALL display a logo mark (small black square with arrow icon) and "PromptForge" wordmark on the left.
3. THE Nav SHALL display center links: `How it works`, `Features`, `Stack`, `Docs`.
4. THE Nav SHALL display a filled black `Get started →` button on the right.
5. WHEN the viewport is mobile-width, THE Nav SHALL hide the center links and retain only the logo and CTA button.

---

### Requirement 4: Landing Page — Hero Section

**User Story:** As a visitor, I want a compelling hero section, so that I immediately understand what PromptForge does.

#### Acceptance Criteria

1. THE Hero SHALL use a centered layout with a maximum width of 720px.
2. THE Hero SHALL display a badge with a green pulse dot and the text "Open source · 100% free stack".
3. THE Hero SHALL display an `<h1>` with the text `Prompts that engineer themselves` at 52px, weight 500, letter-spacing -1.5px.
4. THE Hero SHALL display a single-sentence subtext at 17px in muted color explaining what PromptForge does.
5. THE Hero SHALL display two CTA buttons: a primary filled `Start optimizing →` and a ghost `See a demo run`.
6. THE Hero SHALL use whitespace as the sole visual background — no background images or illustrations.

---

### Requirement 5: Landing Page — Demo Window

**User Story:** As a visitor, I want to see a realistic preview of the app, so that I can evaluate the tool before signing up.

#### Acceptance Criteria

1. THE DemoWindow SHALL render fake browser chrome with three traffic-light dots and a centered window title in mono font.
2. THE DemoWindow SHALL display a two-column interior: a 220px sidebar and a flex main area.
3. THE DemoWindow sidebar SHALL display a ScoreRing at 85% score and a run stats table in mono font.
4. THE DemoWindow main area SHALL display a static PromptDiff showing a hardcoded before/after prompt rewrite.
5. THE DemoWindow main area SHALL display a static optimizer reasoning block below the diff.
6. THE DemoWindow SHALL use only hardcoded static data — no API calls.

---

### Requirement 6: Landing Page — How It Works

**User Story:** As a visitor, I want to understand the optimization loop, so that I can evaluate whether PromptForge fits my workflow.

#### Acceptance Criteria

1. THE HowItWorks section SHALL display a section label and the heading "The optimization loop".
2. THE HowItWorks section SHALL display five steps in a horizontal row: `Define task` → `Seed prompt` → `Evaluate` → `Score + cluster` → `Rewrite`.
3. WHEN rendering each step, THE HowItWorks section SHALL display a 40×40 icon box with `bg-surface` and border, a label, and a one-line description.
4. THE HowItWorks section SHALL display `→` connectors between steps.

---

### Requirement 7: Landing Page — Features, Stack, and CTA

**User Story:** As a visitor, I want to see feature highlights and the tech stack, so that I can assess the tool's capabilities.

#### Acceptance Criteria

1. THE Features section SHALL display a 2-column grid where the first card spans full width.
2. THE Features section featured card SHALL highlight "Failure clustering — the core insight" with an explanation and tag pills.
3. THE Features section SHALL display remaining cards for: Audit trail, LLM-as-judge, Early stopping, Human override.
4. THE StackGrid section SHALL display a 4-column grid of stack cards, each showing tool name, role, and a green "free" badge.
5. THE CtaSection SHALL display a centered large headline and two CTA buttons matching the Hero buttons.

---

### Requirement 8: AppShell and Sidebar

**User Story:** As a user, I want a persistent navigation shell, so that I can move between app sections without losing context.

#### Acceptance Criteria

1. THE AppShell SHALL use `display: flex` with a fixed 240px left sidebar and a `flex: 1` main content area with `overflow-y: auto`.
2. THE AppShell SHALL wrap all routes under `/run`, `/history`, `/prompts`, and `/tasks`.
3. THE Sidebar SHALL display the PromptForge logo and wordmark at the top.
4. THE Sidebar SHALL display nav items with lucide-react icons for: `Dashboard` (→ `/dashboard`), `New run` (→ `/run`), `History` (→ `/history`), `Tasks` (→ `/tasks`).
5. WHEN a nav item matches the current route, THE Sidebar SHALL apply `bg-surface` background and a `2px solid var(--text)` left border accent.
6. THE Sidebar SHALL display a model indicator pill at the bottom with a green pulse dot and the current model name fetched from `GET /api/status`.
7. IF the backend is unreachable, THEN THE Sidebar SHALL display "disconnected" in red in the model indicator pill.

---

### Requirement 9: ScoreRing Component

**User Story:** As a user, I want a visual score indicator, so that I can quickly assess run progress at a glance.

#### Acceptance Criteria

1. THE ScoreRing SHALL render as an SVG with two `<circle>` elements: a track and a progress arc.
2. THE ScoreRing SHALL accept `score` (0–100), `target` (0–100, default 95), `size` (px, default 96), and `strokeWidth` (default 6) props.
3. WHEN `score < 60`, THE ScoreRing SHALL render the progress arc in `#dc2626` (red).
4. WHEN `60 ≤ score < 85`, THE ScoreRing SHALL render the progress arc in `#d97706` (amber).
5. WHEN `score ≥ 85`, THE ScoreRing SHALL render the progress arc in `#16a34a` (green).
6. THE ScoreRing SHALL display the score value centered in mono font with a CSS transition animation.
7. THE ScoreRing SHALL render a small tick mark on the ring at the position corresponding to the target percentage.

---

### Requirement 10: PromptDiff Component

**User Story:** As a user, I want to see a line-by-line diff between prompt versions, so that I can understand what the optimizer changed.

#### Acceptance Criteria

1. THE PromptDiff SHALL accept `oldPrompt` (string), `newPrompt` (string), and `showLineNumbers` (boolean, default true) props.
2. THE PromptDiff SHALL compute a line-by-line diff client-side without an external diff library.
3. WHEN rendering a removed line, THE PromptDiff SHALL apply background `#fef2f2`, text color `#b91c1c`, and a `-` prefix.
4. WHEN rendering an added line, THE PromptDiff SHALL apply background `#f0fdf4`, text color `#15803d`, and a `+` prefix.
5. WHEN rendering an unchanged line, THE PromptDiff SHALL apply no color change and a ` ` prefix.
6. THE PromptDiff SHALL render line numbers in a fixed-width mono span with muted color when `showLineNumbers` is true.
7. THE PromptDiff SHALL wrap long lines rather than introducing horizontal scroll.
8. THE PromptDiff SHALL use mono font throughout.

---

### Requirement 11: TestCaseFeed Component

**User Story:** As a user, I want to see live test case results as they arrive, so that I can monitor run quality in real time.

#### Acceptance Criteria

1. THE TestCaseFeed SHALL accept `results` (TestCaseResult[]) and `maxVisible` (number, default 50) props.
2. THE TestCaseFeed SHALL auto-scroll to the bottom when a new result is appended.
3. WHEN the user has scrolled up, THE TestCaseFeed SHALL pause auto-scroll until the user returns to the bottom.
4. WHEN rendering each row, THE TestCaseFeed SHALL display: a 6px pass/fail dot (green or red), input truncated to 40 chars, expected output (muted, max 20 chars), actual output (primary, max 20 chars), and latency in ms (mono, hint color).
5. WHEN a new row is added, THE TestCaseFeed SHALL animate it in with `opacity 0 → 1` over 150ms.
6. THE TestCaseFeed SHALL virtualise entries beyond `maxVisible` to avoid DOM bloat.

---

### Requirement 12: SparklineChart and FailureBarChart Components

**User Story:** As a user, I want visual charts of score history and failure distribution, so that I can identify trends and problem areas.

#### Acceptance Criteria

1. THE SparklineChart SHALL render a Recharts `AreaChart` showing the last 10 iteration scores with no visible axes.
2. THE SparklineChart SHALL use a green stroke color.
3. THE FailureBarChart SHALL render a Recharts `BarChart` with horizontal bars for the 4 failure types: `wrong_format`, `wrong_content`, `hallucination`, `refusal`.
4. THE FailureBarChart SHALL label each bar with the failure type name and count.

---

### Requirement 13: Live Run View

**User Story:** As a user, I want a real-time view of an active optimization run, so that I can monitor progress and intervene if needed.

#### Acceptance Criteria

1. THE LiveRunView SHALL use a three-column grid layout: `220px | 1fr | 280px`.
2. THE LiveRunView left column SHALL render a RunControlPanel containing: ScoreRing, current and target score in mono, iteration counter (`Iteration 04 / 20`), status badge, stats table, and Pause/Stop/Export buttons.
3. THE LiveRunView center column SHALL render a PromptDiff showing the latest version transition with a mono header label.
4. THE LiveRunView center column SHALL render a collapsible OptimizerReasoning panel below the diff, styled as a terminal block with `bg-surface`, mono font, and muted text.
5. THE LiveRunView right column SHALL render a SparklineChart, FailureBarChart, TestCaseFeed, and a running token counter.
6. THE LiveRunView SHALL receive live updates via the `useRunStream` WebSocket hook.
7. WHEN the user presses `P`, THE LiveRunView SHALL toggle pause/resume on the run.
8. WHEN the user presses `E`, THE LiveRunView SHALL export the best prompt.
9. WHEN the user presses `Esc`, THE LiveRunView SHALL prompt for confirmation then stop the run.
10. WHEN the user presses `←` or `→`, THE LiveRunView SHALL navigate between prompt versions.

---

### Requirement 14: WebSocket Hook (`useRunStream`)

**User Story:** As a developer, I want a reusable WebSocket hook, so that live run data is cleanly managed in React state.

#### Acceptance Criteria

1. THE useRunStream hook SHALL open a WebSocket connection to `ws://{host}/ws/run/{runId}` on mount.
2. THE useRunStream hook SHALL return `run`, `scoreHistory`, `latestVersion`, `testCaseResults`, and `isConnected`.
3. WHEN an `iteration_complete` message is received, THE useRunStream hook SHALL update run state, append to scoreHistory, and set latestVersion.
4. WHEN a `test_case_result` message is received, THE useRunStream hook SHALL append to testCaseResults and cap the array at 200 entries.
5. WHEN a `run_complete` or `run_failed` message is received, THE useRunStream hook SHALL update run status and close the socket.
6. IF the WebSocket closes unexpectedly, THEN THE useRunStream hook SHALL attempt one reconnection.
7. THE useRunStream hook SHALL close the WebSocket and clean up on component unmount.

---

### Requirement 15: New Run Setup Form

**User Story:** As a user, I want a form to configure and launch a new optimization run, so that I can start the process with the right parameters.

#### Acceptance Criteria

1. THE RunConfigForm SHALL display all configuration sections simultaneously in a single centered column with max-width 600px — not a multi-step wizard.
2. THE RunConfigForm SHALL populate a task dropdown from `listTasks()`.
3. WHEN a task is selected, THE RunConfigForm SHALL filter the dataset dropdown to show only datasets for that task via `listDatasets(taskId)`.
4. THE RunConfigForm SHALL provide: a number input for max iterations (default 20, min 1, max 100), a range slider for accuracy target (50–100, step 1) with live readout, a radio group for seed strategy (Zero-shot, Role-based, Chain-of-thought, Format-constrained), and a segmented control for concurrency (1, 3, 5).
5. THE RunConfigForm SHALL display a model radio list showing availability status fetched from `GET /api/models`.
6. THE RunConfigForm SHALL display a mono JSON preview block showing the full run configuration.
7. WHEN the user submits the form, THE RunConfigForm SHALL call `createRun()` and redirect to `/run/[id]`.

---

### Requirement 16: Run History Table

**User Story:** As a user, I want to browse past runs, so that I can compare results and re-run configurations.

#### Acceptance Criteria

1. THE RunHistoryTable SHALL display a full-width table with columns: Run ID, Task, Dataset, Model, Iterations, Score, Status, Started, Duration, Actions.
2. WHEN the score is below 70%, THE RunHistoryTable SHALL render the score cell with a red background badge.
3. WHEN the score is between 70% and 94%, THE RunHistoryTable SHALL render the score cell with an amber background badge.
4. WHEN the score is 95% or above, THE RunHistoryTable SHALL render the score cell with a green background badge.
5. THE RunHistoryTable SHALL display a filter bar with: task filter (select), status filter (multi-select), score range (two number inputs), and date range (two date inputs).
6. WHEN a row is clicked, THE RunHistoryTable SHALL expand inline to show a sparkline of score history.
7. THE RunHistoryTable SHALL display per-row action buttons: View, Re-run, Export, Delete.
8. WHEN no runs exist, THE RunHistoryTable SHALL display an empty state with a blinking cursor animation and the text `> No runs yet. Start your first optimization.`

---

### Requirement 17: Prompt Version Browser

**User Story:** As a user, I want to browse all prompt versions for a run, so that I can review the optimization history and export any version.

#### Acceptance Criteria

1. THE PromptVersionBrowser SHALL display a horizontally scrollable tab strip with one tab per version (`v0`, `v1`, `v2`, etc.).
2. WHEN a version is the best version for the run, THE PromptVersionBrowser SHALL mark its tab with a `*` suffix.
3. THE PromptVersionBrowser left panel SHALL display the full prompt text in a dark code block (bg `#1a1a2e`, mono font, green text `#c3e88d`) with line numbers.
4. THE PromptVersionBrowser right panel SHALL display version metadata: score, iteration, timestamp, failure count, and token count.
5. THE PromptVersionBrowser right panel SHALL display an expandable table of failure cases for the selected version.
6. THE PromptVersionBrowser SHALL provide a `Use this prompt` button that copies the prompt text to the clipboard.
7. THE PromptVersionBrowser SHALL provide a `Compare with v___` control that renders a PromptDiff between the selected version and a user-chosen version.
8. THE PromptVersionBrowser SHALL provide an `Export` button that downloads the prompt as a `.txt` file.

---

### Requirement 18: Toast Notification System

**User Story:** As a user, I want transient notifications for key events, so that I'm informed of run outcomes without blocking my workflow.

#### Acceptance Criteria

1. THE Toast system SHALL display notifications in a fixed-position container at the bottom-right of the screen.
2. THE Toast system SHALL support stacking multiple simultaneous toasts.
3. THE Toast system SHALL auto-dismiss each toast after 4 seconds.
4. THE Toast system SHALL animate toasts in with a slide-in animation.
5. WHEN a run reaches its accuracy target, THE Toast system SHALL display a green toast: `✓ Target reached — {score}%`.
6. WHEN max iterations are reached without hitting the target, THE Toast system SHALL display an amber toast: `Max iterations reached. Best: {score}%`.
7. WHEN a run fails, THE Toast system SHALL display a red toast: `Run failed — check logs`.
8. WHEN a prompt is exported, THE Toast system SHALL display a neutral toast: `Prompt copied to clipboard`.

---

### Requirement 19: Mock Mode for Development

**User Story:** As a developer, I want a mock data mode, so that I can build and style every page without the backend running.

#### Acceptance Criteria

1. THE App SHALL detect mock mode when the URL contains `?mock=true`.
2. WHEN in mock mode, THE App SHALL use hardcoded fixture data from `lib/mocks.ts` instead of making API calls.
3. THE mocks.ts file SHALL contain fixtures for at least one `Run`, multiple `PromptVersion` entries, and multiple `TestCaseResult` entries.
4. WHEN in mock mode, THE useRunStream hook SHALL simulate WebSocket messages using the fixture data.

---

### Requirement 20: API Layer

**User Story:** As a developer, I want a typed API client, so that all backend communication is consistent and error-safe.

#### Acceptance Criteria

1. THE API layer SHALL read the base URL from `NEXT_PUBLIC_API_URL` environment variable, defaulting to `http://localhost:8000`.
2. THE API layer SHALL implement typed functions: `createRun`, `getRun`, `listRuns`, `pauseRun`, `stopRun`, `exportPrompt`, `getPromptVersions`, `getPromptVersion`, `listTasks`, `listDatasets`, and `createRunStream`.
3. WHEN a non-2xx response is received, THE API layer SHALL throw an `Error` with the backend's detail message.
4. THE API layer SHALL export a `createRunStream(runId)` function that returns a `WebSocket` connected to `ws://{host}/ws/run/{runId}`.
5. THE App SHALL define environment variables `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` in a `.env.local` file.
