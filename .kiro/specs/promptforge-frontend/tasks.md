# Tasks — PromptForge Frontend

## Task List

- [x] 1. Design token system and global styles
  - [x] 1.1 Audit `src/styles/tokens.css` — add missing tokens (`--red`, `--amber`, `--green` as hex values `#dc2626`, `#d97706`, `#16a34a`; confirm `--border` is `1px` and `--border-subtle` is `0.5px`)
  - [x] 1.2 Verify `globals.css` imports `tokens.css` and applies base resets (no shadows, no gradients except ScoreRing arc)
  - [x] 1.3 Confirm `app/layout.tsx` injects Inter as `--font-sans` and JetBrains Mono as `--font-mono` on `<html>`, and wraps children in `ToastProvider`

- [x] 2. ScoreRing component — align with requirements
  - [x] 2.1 Refactor `src/components/ScoreRing.tsx` to accept `score` as integer 0–100 (not 0–1 float), `target` (0–100, default 95), `size` (default 96), `strokeWidth` (default 6)
  - [x] 2.2 Replace gradient arc with a single solid stroke color: `#dc2626` when `score < 60`, `#d97706` when `60 ≤ score < 85`, `#16a34a` when `score ≥ 85`
  - [x] 2.3 Add a small tick mark on the ring at the target position
  - [x] 2.4 Ensure score text uses mono font and CSS transition on `stroke-dashoffset`
  - [x] 2.5 Write property test — Feature: promptforge-frontend, Property 1: ScoreRing color threshold (100 runs, fast-check integer in [0,100])

- [x] 3. PromptDiff component — LCS-based diff
  - [x] 3.1 Rewrite `src/components/PromptDiff.tsx` to accept `oldPrompt` (string), `newPrompt` (string), `showLineNumbers` (boolean, default true)
  - [x] 3.2 Implement LCS diff algorithm: split into lines, build DP table, backtrack to produce `DiffOp[]` array
  - [x] 3.3 Render removed lines with `background: #fef2f2`, `color: #b91c1c`, prefix `-`; added lines with `background: #f0fdf4`, `color: #15803d`, prefix `+`; unchanged with no color and prefix ` `
  - [x] 3.4 Render line numbers in fixed-width mono span when `showLineNumbers` is true; wrap long lines (no horizontal scroll)
  - [x] 3.5 Write property test — Feature: promptforge-frontend, Property 2: PromptDiff line classification (100 runs)
  - [x] 3.6 Write property test — Feature: promptforge-frontend, Property 3: PromptDiff round-trip reconstruction (100 runs)

- [x] 4. SparklineChart and FailureBarChart
  - [x] 4.1 Update `src/components/SparklineChart.tsx` to use Recharts `AreaChart` with green stroke, no visible axes, dashed reference line at target
  - [x] 4.2 Update `src/components/FailureBarChart.tsx` to render horizontal bars for `wrong_format`, `wrong_content`, `hallucination`, `refusal` with type name and count labels

- [x] 5. TestCaseFeed component
  - [x] 5.1 Update `src/components/TestCaseFeed.tsx` to accept `results` (TestCaseResult[]) and `maxVisible` (default 50); slice to last `maxVisible` entries for rendering
  - [x] 5.2 Implement auto-scroll: scroll to bottom sentinel on new results; pause when user scrolls up; resume when user returns to bottom
  - [x] 5.3 Render each row: 6px pass/fail dot, input truncated to 40 chars, expected (muted, max 20 chars), actual (primary, max 20 chars), latency in ms (mono)
  - [x] 5.4 Add `opacity 0 → 1` entry animation over 150ms for new rows
  - [x] 5.5 Write property test — Feature: promptforge-frontend, Property 4: TestCaseFeed DOM cap (100 runs)

- [x] 6. RunControlPanel — full left-column implementation
  - [x] 6.1 Expand `src/components/RunControlPanel.tsx` to accept `run` (Run), `scoreHistory` ({version, score}[]), `onPause`, `onStop`, `onExport` callbacks
  - [x] 6.2 Render ScoreRing (integer score), current/target score in mono, iteration counter (`Iteration 04 / 20`), status badge
  - [x] 6.3 Render stats table (passed, failed, token count) and Pause/Stop/Export buttons with keyboard shortcut hints (`P`, `E`, `Esc`)

- [x] 7. Sidebar and AppShell
  - [x] 7.1 Update `src/components/Sidebar.tsx` to use lucide-react icons for nav items (Dashboard, New run, History, Tasks)
  - [x] 7.2 Apply active state: `bg-surface` background + `2px solid var(--text)` left border accent on matching route
  - [x] 7.3 Add model indicator pill at bottom: fetch `GET /api/status`, show green pulse dot + model name; show "disconnected" in red on error
  - [x] 7.4 Verify `src/components/AppShell.tsx` uses `display: flex`, 240px sidebar, `flex: 1` main with `overflow-y: auto`

- [x] 8. Landing page
  - [x] 8.1 Implement `src/components/landing/Nav.tsx` — sticky bar, `backdrop-filter: blur(8px)`, logo, center links, CTA; hide center links on mobile
  - [x] 8.2 Implement `src/components/landing/Hero.tsx` — centered column max-width 720px, badge with green pulse dot, `<h1>` at 52px/500/−1.5px, subtext, two CTA buttons
  - [x] 8.3 Implement `src/components/landing/DemoWindow.tsx` — fake browser chrome, two-column interior, static ScoreRing at 85, static PromptDiff, static optimizer reasoning; no API calls
  - [x] 8.4 Implement `src/components/landing/HowItWorks.tsx` — five steps in horizontal row with `→` connectors, 40×40 icon boxes
  - [x] 8.5 Implement `src/components/landing/Features.tsx` — 2-column grid, first card full-width (Failure clustering), remaining cards for Audit trail, LLM-as-judge, Early stopping, Human override
  - [x] 8.6 Implement `src/components/landing/StackGrid.tsx` — 4-column grid, each card: tool name, role, green "free" badge
  - [x] 8.7 Implement `src/components/landing/CtaSection.tsx` — centered headline + two CTA buttons
  - [x] 8.8 Wire all landing components into `app/page.tsx`

- [x] 9. RunConfigForm — full implementation
  - [x] 9.1 Update `src/components/RunConfigForm.tsx` to show all sections simultaneously in a single column (max-width 600px)
  - [x] 9.2 Add dataset dropdown filtered by selected task via `listDatasets(taskId)`
  - [x] 9.3 Add seed strategy radio group (Zero-shot, Role-based, Chain-of-thought, Format-constrained) and concurrency segmented control (1, 3, 5)
  - [x] 9.4 Add model radio list with availability status from `GET /api/models`
  - [x] 9.5 Add mono JSON preview block showing full run config (live-updated as form changes)
  - [x] 9.6 On submit: call `createRun()` with full `RunConfig`, redirect to `/run/[id]`

- [x] 10. Live run view (`app/(app)/run/[id]/page.tsx`)
  - [x] 10.1 Implement three-column grid layout: `220px | 1fr | 280px`
  - [x] 10.2 Left column: RunControlPanel with ScoreRing, iteration counter, status badge, stats, Pause/Stop/Export buttons
  - [x] 10.3 Center column: PromptDiff showing latest version transition with mono header label; collapsible OptimizerReasoning panel below (terminal block, `bg-surface`, mono, muted text)
  - [x] 10.4 Right column: SparklineChart, FailureBarChart, TestCaseFeed, running token counter
  - [x] 10.5 Wire `useRunStream` hook for live updates; display WS connection status indicator
  - [x] 10.6 Implement keyboard shortcuts: `P` → pause/resume, `E` → export best prompt, `Esc` → confirm then stop, `←`/`→` → navigate versions
  - [x] 10.7 Implement mock mode simulation via `simulateRunStream` when `?mock=true`

- [x] 11. Run history table (`app/(app)/history/page.tsx`)
  - [x] 11.1 Implement `src/components/RunHistoryTable.tsx` with columns: Run ID, Task, Dataset, Model, Iterations, Score, Status, Started, Duration, Actions
  - [x] 11.2 Implement score badge colors: red `< 70%`, amber `70–94%`, green `≥ 95%`
  - [x] 11.3 Implement filter bar: task select, status multi-select, score range inputs, date range inputs (client-side filtering)
  - [x] 11.4 Implement row click to expand inline sparkline of score history
  - [x] 11.5 Implement per-row action buttons: View, Re-run, Export, Delete
  - [x] 11.6 Implement empty state with blinking cursor animation and `> No runs yet. Start your first optimization.`

- [x] 12. Prompt version browser (`app/(app)/prompts/[runId]/page.tsx`)
  - [x] 12.1 Implement `src/components/PromptVersionBrowser.tsx` with horizontally scrollable tab strip; best version tab marked with `*`
  - [x] 12.2 Left panel: full prompt text in dark code block (`bg: #1a1a2e`, mono, green text `#c3e88d`) with line numbers
  - [x] 12.3 Right panel: version metadata (score, iteration, timestamp, failure count, token count); expandable failure cases table
  - [x] 12.4 Implement `Use this prompt` button (copy to clipboard), `Compare with v___` control (renders PromptDiff), `Export` button (downloads `.txt`)

- [x] 13. Toast notification system — property test
  - [x] 13.1 Verify `ToastProvider` auto-dismisses after 4000ms, supports stacking, and animates in with slide-in
  - [x] 13.2 Write property test — Feature: promptforge-frontend, Property 7: Toast auto-dismiss timing (100 runs with fake timers)

- [x] 14. API layer — complete typed client
  - [x] 14.1 Add missing functions to `lib/api.ts`: `createRun`, `getRun`, `listRuns`, `pauseRun`, `stopRun`, `exportPrompt`, `getPromptVersions`, `getPromptVersion`, `listTasks`, `listDatasets`, `createRunStream`, `getModels`, `getStatus`
  - [x] 14.2 Ensure all functions have mock branches importing from `lib/mockData.ts`
  - [x] 14.3 Add `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000` and `NEXT_PUBLIC_WS_URL=ws://localhost:8000`
  - [x] 14.4 Write property test — Feature: promptforge-frontend, Property 6: API error propagation (100 runs, fast-check status codes 400–599)

- [x] 15. useRunStream hook — align with requirements
  - [x] 15.1 Update `src/hooks/useRunStream.ts` to return `run`, `scoreHistory`, `latestVersion`, `testCaseResults`, `isConnected`
  - [x] 15.2 On `iteration_complete`: update run state, append to `scoreHistory`, set `latestVersion`
  - [x] 15.3 On `test_case_result`: append to `testCaseResults` and cap array at 200 entries
  - [x] 15.4 On `run_complete` or `run_failed`: update run status and close socket
  - [x] 15.5 Implement one reconnection attempt on unexpected close (existing backoff logic satisfies this)
  - [x] 15.6 Write property test — Feature: promptforge-frontend, Property 5: useRunStream testCaseResults array cap (100 runs)

- [x] 16. Mock mode — complete fixture data
  - [x] 16.1 Ensure `lib/mockData.ts` contains at least one `Run`, multiple `PromptVersion` entries, and multiple `TestCaseResult` entries (already present; verify completeness)
  - [x] 16.2 Verify `simulateRunStream` emits all required WsEvent types and that `useRunStream` in mock mode uses it instead of opening a WebSocket
