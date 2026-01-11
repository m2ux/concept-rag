# ASCII Progress Bar Display - Feature Plan

**Date:** November 30, 2025  
**Status:** PLANNING  
**Priority:** HIGH (UX improvement)  
**Estimated Effort:** 2-3 hours

---

## Overview

Replace the current line-by-line progress output with a multi-line ASCII progress bar display that updates in place. Each worker (0-19) gets a dedicated line showing real-time progress.

---

## Current State

```
[0] 📊 Progress: 0/50 (0%) - Refactoring_ Improving the Design of Exi  🔄 Processing chunk 1/3...
[1] 📊 Progress: 0/50 (0%) - Software Architecture_ The Hard Parts_ M  🔄 Processing chunk 1/2...
[2] 📊 Progress: 0/50 (0%) - Software Development, Design, and Coding  🔄 Processing chunk 1/3...
... (creates new lines for each update)
```

**Problems:**
- Each progress update creates a new line
- Output scrolls rapidly, hard to track
- Can't see all workers at once
- Unclear which worker is which

---

## Target State

```
Worker Progress (20 concurrent, 10/50 docs complete - 20%):
[0]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Software Architecture_ The Hard Parts.pdf           🔄 2/3
[1]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Building Microservices.pdf                          🔄 1/4
[2]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Clean Architecture.pdf                              ✅ done
[3]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Domain-Driven Design.pdf                            🔄 2/3
[4]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Enterprise Integration Patterns.pdf                 🔄 1/4
[5]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Fundamentals of Software Architecture.pdf           🔄 3/3
[6]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Head First Design Patterns.pdf                      ⏳ wait
[7]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Introduction to Algorithms.pdf                      🔄 2/6
[8]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Microservices Patterns.pdf                          🔄 1/2
[9]  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Refactoring.pdf                                     🔄 2/3
[10] [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Software Requirements.pdf                           🔄 1/5
[11] [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Test Driven Development.pdf                         🔄 1/2
[12] [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% The Art of Unit Testing.pdf                         🔄 2/2
[13] [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% The Pragmatic Programmer.pdf                        🔄 1/2
[14] [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% The Software Engineers Guidebook.pdf                🔄 2/3
[15] [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% Zero To Production In Rust.pdf                      🔄 3/4
[16] [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% -                                                   ⏳ idle
[17] [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% -                                                   ⏳ idle
[18] [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% -                                                   ⏳ idle
[19] [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% -                                                   ⏳ idle
```

**Benefits:**
- All 20 workers visible at once
- Lines update in place (no scrolling)
- Clear visual progress bar
- Shows overall % completion
- Shows chunk progress per worker
- Worker state clearly indicated (🔄 working, ✅ done, ⏳ idle/waiting)

---

## Technical Approach

### ANSI Escape Codes

| Code | Effect |
|------|--------|
| `\x1B[{n}A` | Move cursor up n lines |
| `\x1B[{n}B` | Move cursor down n lines |
| `\r` | Return to start of line |
| `\x1B[K` | Clear to end of line |
| `\x1B[?25l` | Hide cursor |
| `\x1B[?25h` | Show cursor |

### State Management

```typescript
interface WorkerState {
  workerIndex: number;
  documentName: string | null;
  chunkNum: number;
  totalChunks: number;
  status: 'idle' | 'processing' | 'done' | 'waiting';
}

interface ProgressDisplayState {
  completed: number;
  total: number;
  workers: WorkerState[];
}
```

### Architecture

```
┌─────────────────────────────────────────┐
│ ProgressBarDisplay (new class)          │
│ - initialize(workerCount)               │
│ - updateWorker(index, state)            │
│ - updateProgress(completed, total)      │
│ - render()                              │
│ - cleanup()                             │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ hybrid_fast_seed.ts                     │
│ - Create ProgressBarDisplay instance    │
│ - Pass to onChunkProgress callback      │
│ - Update on document completion         │
└─────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Create ProgressBarDisplay Class (45-60 min)

**File:** `src/infrastructure/cli/progress-bar-display.ts`

**Deliverables:**
- `ProgressBarDisplay` class with ANSI-based rendering
- State management for worker states
- Methods: `initialize()`, `updateWorker()`, `updateProgress()`, `render()`, `cleanup()`

**Subtasks:**
- [ ] Create `WorkerState` and `ProgressDisplayState` interfaces
- [ ] Implement `initialize(workerCount)` - print initial empty lines
- [ ] Implement `updateWorker(index, state)` - update single worker state
- [ ] Implement `updateProgress(completed, total)` - update overall progress
- [ ] Implement `render()` - redraw all lines using ANSI escape codes
- [ ] Implement `cleanup()` - restore cursor, print final state
- [ ] Implement `formatProgressBar(percent, width)` - ASCII bar rendering

**Unit Tests:** `src/infrastructure/cli/__tests__/progress-bar-display.test.ts`
- Test state management
- Test progress bar formatting
- Test worker state transitions

---

### Task 2: Integrate with hybrid_fast_seed.ts (30-45 min)

**File:** `hybrid_fast_seed.ts`

**Deliverables:**
- Replace current progress logging with `ProgressBarDisplay`
- Wire up callbacks to update display
- Handle cleanup on completion/interruption

**Subtasks:**
- [ ] Import and instantiate `ProgressBarDisplay`
- [ ] Update `onChunkProgress` to call `display.updateWorker()`
- [ ] Update `onProgress` to call `display.updateProgress()`
- [ ] Add `onWorkerStart` callback (new) for worker assignment
- [ ] Add `onWorkerComplete` callback (new) for worker done state
- [ ] Handle SIGINT for cleanup
- [ ] Call `display.cleanup()` on completion

---

### Task 3: Update ParallelConceptExtractor Callbacks (20-30 min)

**File:** `src/concepts/parallel-concept-extractor.ts`

**Deliverables:**
- Add `onWorkerStart` callback for when worker picks up document
- Add `onWorkerComplete` callback for when worker finishes document
- Pass worker index through all callbacks

**Subtasks:**
- [ ] Add `onWorkerStart?: (workerIndex, source) => void` to options
- [ ] Add `onWorkerComplete?: (workerIndex, source) => void` to options
- [ ] Call callbacks at appropriate points in `processBatch()`

---

### Task 4: Handle Edge Cases & Polish (20-30 min)

**Deliverables:**
- Handle terminal resize gracefully
- Handle non-TTY output (fall back to simple logging)
- Handle errors/warnings without breaking display
- Test with actual seeding run

**Subtasks:**
- [ ] Check `process.stdout.isTTY` before using ANSI codes
- [ ] Implement fallback for non-TTY (pipe, file redirect)
- [ ] Add error/warning output below progress display
- [ ] Test with `--max-docs 10` for quick validation
- [ ] Verify cleanup on Ctrl+C

---

## Success Criteria

### Functional
- [ ] 20 worker lines displayed (configurable)
- [ ] Lines update in place (no scrolling)
- [ ] Progress bar shows overall % completion
- [ ] Chunk progress shown per worker
- [ ] Worker states clearly indicated
- [ ] Graceful fallback for non-TTY

### Quality
- [ ] Unit tests for ProgressBarDisplay
- [ ] No flickering or visual artifacts
- [ ] Clean exit on completion
- [ ] Clean exit on Ctrl+C
- [ ] Error messages don't break display

### Performance
- [ ] Render updates throttled (max 10/sec)
- [ ] No noticeable CPU overhead
- [ ] Smooth visual updates

---

## Files to Create/Modify

### New Files
- `src/infrastructure/cli/progress-bar-display.ts`
- `src/infrastructure/cli/__tests__/progress-bar-display.test.ts`
- `src/infrastructure/cli/index.ts` (barrel export)

### Modified Files
- `hybrid_fast_seed.ts` - Use ProgressBarDisplay
- `src/concepts/parallel-concept-extractor.ts` - Add worker callbacks

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Terminal compatibility | Check isTTY, provide fallback |
| ANSI codes in CI logs | Detect CI environment, disable fancy output |
| Performance overhead | Throttle renders to 10/sec max |
| Cursor position issues | Always cleanup() on exit |

---

## Estimated Timeline

| Task | Estimate |
|------|----------|
| Task 1: ProgressBarDisplay class | 45-60 min |
| Task 2: Integration with seeding | 30-45 min |
| Task 3: Callback updates | 20-30 min |
| Task 4: Edge cases & polish | 20-30 min |
| **Total** | **2-3 hours** |

---

## Not In Scope

- Colors (keep it simple with ASCII)
- Animated spinners
- ETA calculation
- Persistent progress file
- Web UI for progress

---

## Ready for Implementation

- [ ] Plan reviewed
- [ ] Approach approved
- [ ] Branch created: `feat/ascii-progress-bar`
- [ ] TODOs created















