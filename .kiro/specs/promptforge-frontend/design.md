# Design Document — PromptForge Frontend

## Overview

PromptForge Frontend is a Next.js 15 (App Router) application written in TypeScript with TailwindCSS v4 and inline CSS custom properties. It provides two surfaces:

1. **Landing page** (`/`) — public marketing page with a live demo window
2. **App shell** (`/(app)/*`) — authenticated dashboard for running, monitoring, and reviewing prompt optimization runs

The backend is a FastAPI service. The frontend communicates with it via a typed REST API client and a WebSocket hook (`useRunStream`). A `?mock=true` query parameter activates mock mode, which replaces all API calls with fixture data so the UI can be developed and demoed without a running backend.

The existing codebase already has a working skeleton. This design formalises the architecture, fills in missing pieces, and defines correctness properties for property-based testing.

---

## Architecture

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout — Inter + JetBrains Mono fonts, ToastProvider
│   ├── page.tsx                # Landing page (public)
│   ├── globals.css             # @import tokens.css; base resets
│   └── (app)/
│       ├── layout.tsx          # AppShell wrapper (Sidebar + main)
│       ├── dashboard/page.tsx
│       ├── run/
│       │   ├── page.tsx        # RunConfigForm
│       │   └── [id]/page.tsx   # LiveRunView
│       ├── history/page.tsx    # RunHistoryTable
│       ├── prompts/[runId]/page.tsx  # PromptVersionBrowser
│       └── tasks/page.tsx
├── src/
│   ├── components/
│   │   ├── landing/            # Nav, Hero, DemoWindow, HowItWorks, Features, StackGrid, CtaSection
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ScoreRing.tsx
│   │   ├── PromptDiff.tsx
│   │   ├── TestCaseFeed.tsx
│   │   ├── SparklineChart.tsx
│   │   ├── FailureBarChart.tsx
│   │   ├── RunControlPanel.tsx
│   │   ├── RunConfigForm.tsx
│   │   ├── RunHistoryTable.tsx
│   │   ├── PromptVersionBrowser.tsx
│   │   ├── Toast.tsx
│   │   └── ToastProvider.tsx
│   ├── hooks/
│   │   ├── useRunStream.ts
│   │   ├── useRunHistory.ts
│   │   └── usePromptVersions.ts
│   └── styles/
│       └── tokens.css
├── lib/
│   ├── api.ts                  # Typed REST + WebSocket client
│   ├── types.ts                # Shared TypeScript types
│   ├── utils.ts                # formatDate, formatScore, statusBadgeClass
│   └── mockData.ts             # Fixture data + simulateRunStream
```

### Data flow summary

```
Page component
  └─ fetches initial data via lib/api.ts (REST)
  └─ subscribes to live updates via useRunStream (WebSocket)
       └─ dispatches WsEvent → local React state
  └─ renders UI components (pure / presentational)
       └─ ScoreRing, PromptDiff, TestCaseFeed, charts, etc.
  └─ user actions → lib/api.ts mutations → Toast feedback
```

---

## Components and Interfaces

### Design Token System (`src/styles/tokens.css`)

All color, spacing, radius, and typography values are CSS custom properties. Components reference tokens via `var(--token-name)` — never raw Tailwind color utilities. Key tokens:

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0a0a0f` | Page background |
| `--bg-surface` | `#111118` | Sidebar, panels |
| `--bg-card` | `#16161f` | Cards, toasts |
| `--text` | `#e8e8ed` | Primary text |
| `--text-secondary` | `#8b8b9e` | Labels, captions |
| `--text-muted` | `#55556a` | Hints, placeholders |
| `--border` | `#2a2a3a` | 1px card borders |
| `--border-subtle` | `rgba(42,42,58,0.5)` | 0.5px dividers |
| `--font-sans` | injected by next/font | Body font (Inter) |
| `--font-mono` | injected by next/font | Code, stats, diff |

Font weights: `400` for body, `500` for headings/labels. No `600`/`700`. No drop shadows. No gradients except ScoreRing arc.

### Landing Page Components

All landing components live in `src/components/landing/`.

**Nav** — sticky bar with `backdrop-filter: blur(8px)`, logo, center links, CTA button. Center links hidden on mobile.

**Hero** — centered column, max-width 720px. Badge with green pulse dot, `<h1>` at 52px/500 weight/−1.5px letter-spacing, subtext, two CTA buttons.

**DemoWindow** — fake browser chrome (traffic-light dots + mono title), two-column interior (220px sidebar + flex main). Sidebar shows a static `ScoreRing` at 85% and a stats table. Main area shows a static `PromptDiff` and optimizer reasoning block. All data is hardcoded — no API calls.

**HowItWorks** — five steps in a horizontal row with `→` connectors. Each step: 40×40 icon box, label, one-line description.

**Features** — 2-column grid, first card full-width. Cards for: Failure clustering (featured), Audit trail, LLM-as-judge, Early stopping, Human override.

**StackGrid** — 4-column grid of stack cards (tool name, role, green "free" badge).

**CtaSection** — centered headline + two CTA buttons.

### AppShell and Sidebar

**AppShell** — `display: flex`, fixed 240px sidebar, `flex: 1` main with `overflow-y: auto`. Wraps all `/(app)/*` routes via `app/(app)/layout.tsx`.

**Sidebar** — fixed left panel. Logo at top. Nav items with lucide-react icons for Dashboard, New run, History, Tasks. Active item: `bg-surface` + `2px solid var(--text)` left border. Model indicator pill at bottom: green pulse dot + model name from `GET /api/status`. Shows "disconnected" in red if backend unreachable.

### ScoreRing (`src/components/ScoreRing.tsx`)

SVG component with two `<circle>` elements (track + arc). Props: `score` (0–100), `target` (0–100, default 95), `size` (px, default 96), `strokeWidth` (default 6).

Color logic (applied to arc stroke, not gradient):
- `score < 60` → `#dc2626` (red)
- `60 ≤ score < 85` → `#d97706` (amber)
- `score ≥ 85` → `#16a34a` (green)

Score value centered in mono font with CSS transition. Small tick mark at target position.

> Note: The current implementation uses a gradient and a 0–1 float scale. The redesign aligns with requirements: integer 0–100 scale, three discrete color thresholds, no gradient on the arc.

### PromptDiff (`src/components/PromptDiff.tsx`)

Props: `oldPrompt` (string), `newPrompt` (string), `showLineNumbers` (boolean, default true).

The component computes a line-by-line diff client-side using the LCS (Longest Common Subsequence) algorithm:

```
1. Split oldPrompt and newPrompt into line arrays
2. Build LCS table (standard DP, O(m×n) time and space)
3. Backtrack to produce a sequence of {type: 'add'|'remove'|'equal', line: string} operations
4. Render each operation as a styled row
```

Line styling:
- Removed: `background: #fef2f2`, `color: #b91c1c`, prefix `-`
- Added: `background: #f0fdf4`, `color: #15803d`, prefix `+`
- Unchanged: no color change, prefix ` `

Line numbers in fixed-width mono span with muted color when `showLineNumbers` is true. Lines wrap (no horizontal scroll). Mono font throughout.

> Note: The current implementation accepts a pre-computed `diff` string. The redesign accepts `oldPrompt`/`newPrompt` and computes the diff internally, matching requirements 10.1–10.8.

### TestCaseFeed (`src/components/TestCaseFeed.tsx`)

Props: `results` (TestCaseResult[]), `maxVisible` (number, default 50).

Virtualization: only the last `maxVisible` entries are rendered in the DOM. Entries beyond the cap are sliced off — no virtual scroll library needed at this scale.

Auto-scroll: a `useEffect` watches `results.length`. If the user has not scrolled up (detected via a scroll event listener comparing `scrollTop + clientHeight` to `scrollHeight`), it calls `scrollIntoView` on a sentinel `<div ref={bottomRef}>`. Auto-scroll pauses when the user scrolls up and resumes when they return to the bottom.

Row layout: 6px pass/fail dot (green/red), input truncated to 40 chars, expected (muted, max 20 chars), actual (primary, max 20 chars), latency in ms (mono, hint color). New rows animate in with `opacity 0 → 1` over 150ms via a CSS keyframe.

### SparklineChart (`src/components/SparklineChart.tsx`)

Recharts `AreaChart` (or `LineChart`) showing last 10 iteration scores. No visible axes. Green stroke. Dashed reference line at target.

### FailureBarChart (`src/components/FailureBarChart.tsx`)

Recharts `BarChart` with horizontal bars for four failure types: `wrong_format`, `wrong_content`, `hallucination`, `refusal`. Each bar labeled with type name and count.

### RunControlPanel (`src/components/RunControlPanel.tsx`)

Left column of the live run view. Contains: ScoreRing, current/target score in mono, iteration counter (`Iteration 04 / 20`), status badge, stats table (passed/failed/tokens), Pause/Stop/Export buttons with keyboard shortcut hints.

### RunConfigForm (`src/components/RunConfigForm.tsx`)

Single centered column, max-width 600px. All sections visible simultaneously (not a wizard). Sections:
- Task dropdown (populated from `listTasks()`)
- Dataset dropdown (filtered by selected task via `listDatasets(taskId)`)
- Max iterations number input (default 20, min 1, max 100)
- Accuracy target range slider (50–100, step 1) with live readout
- Seed strategy radio group (Zero-shot, Role-based, Chain-of-thought, Format-constrained)
- Concurrency segmented control (1, 3, 5)
- Model radio list with availability status from `GET /api/models`
- Mono JSON preview block showing full run config
- Submit button → `createRun()` → redirect to `/run/[id]`

### RunHistoryTable (`src/components/RunHistoryTable.tsx`)

Full-width table. Columns: Run ID, Task, Dataset, Model, Iterations, Score, Status, Started, Duration, Actions.

Score badge colors: red (`< 70%`), amber (`70–94%`), green (`≥ 95%`).

Filter bar: task select, status multi-select, score range (two number inputs), date range (two date inputs). Filters are applied client-side over the fetched runs array.

Row click expands inline to show a sparkline of score history. Per-row actions: View, Re-run, Export, Delete.

Empty state: blinking cursor animation + `> No runs yet. Start your first optimization.`

### PromptVersionBrowser (`src/components/PromptVersionBrowser.tsx`)

Horizontally scrollable tab strip (one tab per version, `v0`, `v1`, etc.). Best version tab marked with `*` suffix.

Two-panel layout:
- Left: full prompt text in dark code block (`bg: #1a1a2e`, mono font, green text `#c3e88d`) with line numbers
- Right: version metadata (score, iteration, timestamp, failure count, token count), expandable failure cases table

Actions: `Use this prompt` (copies to clipboard), `Compare with v___` control (renders PromptDiff), `Export` (downloads `.txt`).

### Toast System (`src/components/ToastProvider.tsx` + `Toast.tsx`)

Fixed-position container at bottom-right. Supports stacking (max 3 visible, rest queued). Auto-dismiss after 4 seconds. Slide-in animation on entry.

Variants: `success` (green), `error` (red), `info` (blue), `warning` (amber).

Trigger events:
- Target reached → green: `✓ Target reached — {score}%`
- Max iterations → amber: `Max iterations reached. Best: {score}%`
- Run failed → red: `Run failed — check logs`
- Prompt exported → neutral: `Prompt copied to clipboard`

---

## Data Models

These extend the existing `lib/types.ts`:

```typescript
// Existing types (unchanged)
export type RunStatus = 'running' | 'completed' | 'early_stopped' | 'error' | 'max_iterations';
export interface Task { task_id, task_type, description, evaluation_method, dataset_size? }
export interface PromptVersion { version, prompt_text, score, passed, failed, failure_summary, optimizer_reasoning, prompt_diff, timestamp }
export interface Run { run_id, task_id, status, total_iterations, best_score, best_version, accuracy_target, llm_provider, started_at, finished_at, prompt_versions }
export interface RunSummary { run_id, task_id, status, total_iterations, best_score, best_version, started_at, finished_at }
export interface TestCaseResult { id, input, expected, actual, passed, timestamp }
export type WsEventType = 'iteration_start' | 'test_case_result' | 'iteration_end' | 'run_complete' | 'error'
export interface WsEvent { type, run_id, data }

// New types needed
export interface ModelInfo {
  id: string;
  name: string;
  available: boolean;
  provider: string;
}

export interface RunConfig {
  task_id: string;
  dataset_id?: string;
  max_iterations: number;
  accuracy_target: number;
  seed_strategy: 'zero_shot' | 'role_based' | 'chain_of_thought' | 'format_constrained';
  concurrency: 1 | 3 | 5;
  model_id: string;
}

// Diff operation (internal to PromptDiff)
type DiffOp = { type: 'add' | 'remove' | 'equal'; line: string };
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The project uses **fast-check** (already in `devDependencies`) for property-based testing with **vitest** as the test runner. Each property test runs a minimum of 100 iterations.

### Property 1: ScoreRing color threshold

*For any* integer score in [0, 100], the ScoreRing arc stroke color must be `#dc2626` when `score < 60`, `#d97706` when `60 ≤ score < 85`, and `#16a34a` when `score ≥ 85`.

**Validates: Requirements 9.3, 9.4, 9.5**

### Property 2: PromptDiff line classification

*For any* pair of prompt strings (oldPrompt, newPrompt), every line rendered by PromptDiff must be classified as exactly one of: removed (prefix `-`, red styling), added (prefix `+`, green styling), or unchanged (prefix ` `, no color change). No line may be rendered without a classification.

**Validates: Requirements 10.3, 10.4, 10.5**

### Property 3: PromptDiff round-trip reconstruction

*For any* pair of prompt strings (oldPrompt, newPrompt), applying all `+` lines and discarding all `-` lines from the PromptDiff output must reconstruct `newPrompt` exactly (modulo leading prefix character).

**Validates: Requirements 10.2**

### Property 4: TestCaseFeed DOM cap

*For any* array of TestCaseResult entries with length greater than `maxVisible`, the number of rendered result rows in the DOM must be at most `maxVisible`.

**Validates: Requirements 11.6**

### Property 5: useRunStream testCaseResults array cap

*For any* sequence of `test_case_result` WebSocket messages with total count greater than 200, the `testCaseResults` array returned by `useRunStream` must never exceed 200 entries.

**Validates: Requirements 14.4**

### Property 6: API error propagation

*For any* HTTP status code in [400, 599] and any detail string, when the backend returns that status with a JSON body `{ detail }`, the API client function must throw an `Error` whose message equals the detail string.

**Validates: Requirements 20.3**

### Property 7: Toast auto-dismiss timing

*For any* toast message and variant, after exactly 4000ms have elapsed (using fake timers), the toast must no longer be present in the DOM.

**Validates: Requirements 18.3**

---

## Error Handling

### API errors
- All API functions use a shared `handleResponse<T>` helper that reads `body.detail` on non-2xx responses and throws `new Error(detail)`.
- Page components catch errors in `useEffect` and store them in local `error` state, rendering an inline error message with a back link.
- Mutations (startRun, pauseRun, stopRun, exportPrompt) catch errors and call `addToast(message, 'error')`.

### WebSocket errors
- `useRunStream` implements exponential backoff retry (up to 5 attempts, max 30s delay) on unexpected close.
- A clean close (code 1000) or component unmount does not trigger retry.
- Connection status (`connecting | open | closed | error`) is surfaced to the page for display in the run view header.

### Mock mode
- `isMockMode()` checks `window.location.search` for `?mock=true`.
- All API functions have a mock branch that imports from `lib/mockData.ts` dynamically (tree-shaken in production).
- `useRunStream` in mock mode does not open a WebSocket; instead, `simulateRunStream` fires mock events on timers.

### Form validation
- RunConfigForm validates: task selected, max iterations in [1, 100], accuracy target in [50, 100].
- Submit button is disabled while loading or when validation fails.
- Submission errors are shown via toast.

---

## Testing Strategy

### Dual testing approach

Both unit tests and property-based tests are required. They are complementary:
- Unit tests catch concrete bugs with specific examples and edge cases.
- Property tests verify universal invariants across many generated inputs.

### Unit tests (vitest + @testing-library/react)

Focus areas:
- Specific rendering examples (ScoreRing shows correct percentage text)
- Edge cases (PromptDiff with empty strings, TestCaseFeed with zero items)
- Integration points (RunConfigForm submit calls `startRun` and redirects)
- Toast queue behavior (queuing beyond 3, promoting on dismiss)
- Sidebar active state (correct link highlighted for current route)

### Property-based tests (fast-check, minimum 100 iterations each)

Each property test is tagged with a comment referencing the design property:

```
// Feature: promptforge-frontend, Property 1: ScoreRing color threshold
// Feature: promptforge-frontend, Property 2: PromptDiff line classification
// Feature: promptforge-frontend, Property 3: PromptDiff round-trip reconstruction
// Feature: promptforge-frontend, Property 4: TestCaseFeed DOM cap
// Feature: promptforge-frontend, Property 5: useRunStream testCaseResults array cap
// Feature: promptforge-frontend, Property 6: API error propagation
// Feature: promptforge-frontend, Property 7: Toast auto-dismiss timing
```

Each correctness property is implemented by a single property-based test. Tests live in `src/__tests__/properties.test.tsx` and `src/__tests__/api-properties.test.ts`.

### Test configuration

Vitest is configured in `vitest.config.ts` with jsdom environment and `@testing-library/jest-dom` matchers. The `@` path alias resolves to the workspace root. Property tests run with `numRuns: 100` minimum.
