/**
 * ASCII Progress Bar Display
 *
 * Multi-line progress bar display for parallel document processing.
 * Uses ANSI escape codes to update lines in place without scrolling.
 *
 * @example
 * ```typescript
 * const display = new ProgressBarDisplay(20); // 20 workers
 * display.initialize();
 *
 * // Update worker state
 * display.updateWorker(0, {
 *   documentName: 'Document.pdf',
 *   chunkNum: 1,
 *   totalChunks: 3,
 *   status: 'processing'
 * });
 *
 * // Update overall progress
 * display.updateProgress(5, 50);
 *
 * // Cleanup on exit
 * display.cleanup();
 * ```
 */

/** Worker status states */
export type WorkerStatus = 'idle' | 'processing' | 'done' | 'waiting';

/** State for a single worker */
export interface WorkerState {
  documentName: string | null;
  chunkNum: number;
  totalChunks: number;
  status: WorkerStatus;
}

/** Overall progress display state */
export interface ProgressDisplayState {
  completed: number;
  total: number;
  workers: WorkerState[];
}

/** Configuration options for ProgressBarDisplay */
export interface ProgressBarDisplayOptions {
  /** Width of the progress bar in characters (default: 40) */
  barWidth?: number;
  /** Maximum document name length before truncation (default: 50) */
  maxDocNameLength?: number;
  /** Minimum render interval in ms (default: 100ms = 10 fps) */
  minRenderInterval?: number;
  /** Force TTY mode even if not detected (for testing) */
  forceTTY?: boolean;
  /** Output stream (default: process.stdout) */
  output?: NodeJS.WriteStream;
}

/** ANSI escape codes for terminal control */
const ANSI = {
  /** Move cursor up n lines */
  up: (n: number) => `\x1B[${n}A`,
  /** Move cursor down n lines */
  down: (n: number) => `\x1B[${n}B`,
  /** Return to start of line */
  carriageReturn: '\r',
  /** Clear to end of line */
  clearLine: '\x1B[K',
  /** Hide cursor */
  hideCursor: '\x1B[?25l',
  /** Show cursor */
  showCursor: '\x1B[?25h',
  /** Move to column n */
  column: (n: number) => `\x1B[${n}G`,
};

/** Status emoji indicators */
const STATUS_ICONS: Record<WorkerStatus, string> = {
  idle: '⏳',
  waiting: '⏳',
  processing: '🔄',
  done: '✅',
};

/**
 * Multi-line ASCII progress bar display for parallel processing.
 *
 * Features:
 * - Updates lines in place (no scrolling)
 * - Shows all workers simultaneously
 * - Visual progress bar per worker
 * - Overall completion percentage
 * - Throttled rendering for performance
 * - Graceful fallback for non-TTY environments
 */
export class ProgressBarDisplay {
  private state: ProgressDisplayState;
  private readonly workerCount: number;
  private readonly barWidth: number;
  private readonly maxDocNameLength: number;
  private readonly minRenderInterval: number;
  private readonly isTTY: boolean;
  private readonly output: NodeJS.WriteStream;
  private initialized: boolean = false;
  private lastRenderTime: number = 0;
  private pendingRender: boolean = false;
  private renderTimeout: NodeJS.Timeout | null = null;

  /**
   * Creates a new progress bar display.
   *
   * @param workerCount - Number of parallel workers to display
   * @param options - Configuration options
   */
  constructor(workerCount: number, options: ProgressBarDisplayOptions = {}) {
    this.workerCount = workerCount;
    this.barWidth = options.barWidth ?? 40;
    this.maxDocNameLength = options.maxDocNameLength ?? 50;
    this.minRenderInterval = options.minRenderInterval ?? 100;
    this.output = options.output ?? process.stdout;
    this.isTTY = options.forceTTY ?? (this.output.isTTY ?? false);

    // Initialize worker states
    this.state = {
      completed: 0,
      total: 0,
      workers: Array.from({ length: workerCount }, () => ({
        documentName: null,
        chunkNum: 0,
        totalChunks: 0,
        status: 'idle' as WorkerStatus,
      })),
    };
  }

  /**
   * Initializes the display by printing empty lines and hiding cursor.
   * Must be called before any updates.
   */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (this.isTTY) {
      // Hide cursor for cleaner display
      this.output.write(ANSI.hideCursor);

      // Print header + worker lines (creates space for updates)
      this.output.write('\n'); // Header line
      for (let i = 0; i < this.workerCount; i++) {
        this.output.write('\n');
      }

      // Move cursor back up to start position
      this.output.write(ANSI.up(this.workerCount + 1));
    }

    // Initial render
    this.render(true);
  }

  /**
   * Updates a single worker's state.
   *
   * @param workerIndex - Index of the worker (0-based)
   * @param state - Partial worker state to update
   */
  updateWorker(
    workerIndex: number,
    state: Partial<Omit<WorkerState, 'workerIndex'>>
  ): void {
    if (workerIndex < 0 || workerIndex >= this.workerCount) return;

    const worker = this.state.workers[workerIndex];
    if (state.documentName !== undefined)
      worker.documentName = state.documentName;
    if (state.chunkNum !== undefined) worker.chunkNum = state.chunkNum;
    if (state.totalChunks !== undefined) worker.totalChunks = state.totalChunks;
    if (state.status !== undefined) worker.status = state.status;

    this.scheduleRender();
  }

  /**
   * Updates overall progress counters.
   *
   * @param completed - Number of completed documents
   * @param total - Total number of documents
   */
  updateProgress(completed: number, total: number): void {
    this.state.completed = completed;
    this.state.total = total;
    this.scheduleRender();
  }

  /**
   * Forces an immediate render, bypassing throttling.
   */
  forceRender(): void {
    this.render(true);
  }

  /**
   * Cleans up the display, showing cursor and printing final state.
   */
  cleanup(): void {
    if (!this.initialized) return;

    // Cancel any pending render
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
      this.renderTimeout = null;
    }

    // Final render
    this.render(true);

    if (this.isTTY) {
      // Move cursor below the display
      this.output.write(ANSI.down(this.workerCount + 1));
      this.output.write('\n');
      // Show cursor
      this.output.write(ANSI.showCursor);
    }

    this.initialized = false;
  }

  /**
   * Gets the current display state (for testing).
   */
  getState(): ProgressDisplayState {
    return { ...this.state, workers: this.state.workers.map((w) => ({ ...w })) };
  }

  /**
   * Schedules a render with throttling.
   */
  private scheduleRender(): void {
    if (!this.initialized) return;

    const now = Date.now();
    const timeSinceLastRender = now - this.lastRenderTime;

    if (timeSinceLastRender >= this.minRenderInterval) {
      // Enough time has passed, render immediately
      this.render(false);
    } else if (!this.pendingRender) {
      // Schedule a render for later
      this.pendingRender = true;
      const delay = this.minRenderInterval - timeSinceLastRender;
      this.renderTimeout = setTimeout(() => {
        this.pendingRender = false;
        this.renderTimeout = null;
        this.render(false);
      }, delay);
    }
    // If pendingRender is true, a render is already scheduled
  }

  /**
   * Renders the entire display.
   *
   * @param force - Whether to bypass throttling
   */
  private render(force: boolean): void {
    if (!this.initialized) return;

    if (!force) {
      const now = Date.now();
      if (now - this.lastRenderTime < this.minRenderInterval) {
        return;
      }
      this.lastRenderTime = now;
    } else {
      this.lastRenderTime = Date.now();
    }

    if (this.isTTY) {
      this.renderTTY();
    } else {
      this.renderNonTTY();
    }
  }

  /**
   * Renders to a TTY with ANSI escape codes.
   */
  private renderTTY(): void {
    const lines: string[] = [];

    // Header line
    const pct =
      this.state.total > 0
        ? Math.round((this.state.completed / this.state.total) * 100)
        : 0;
    lines.push(
      `Worker Progress (${this.workerCount} concurrent, ${this.state.completed}/${this.state.total} docs complete - ${pct}%):`
    );

    // Worker lines
    for (let i = 0; i < this.workerCount; i++) {
      lines.push(this.formatWorkerLine(i, this.state.workers[i]));
    }

    // Build output with ANSI codes
    let output = '';
    for (let i = 0; i < lines.length; i++) {
      output += ANSI.carriageReturn + ANSI.clearLine + lines[i];
      if (i < lines.length - 1) {
        output += ANSI.down(1);
      }
    }
    // Move back to start
    output += ANSI.up(lines.length - 1);

    this.output.write(output);
  }

  /**
   * Renders to non-TTY with simple logging (fallback).
   */
  private renderNonTTY(): void {
    // Only log significant changes for non-TTY
    const pct =
      this.state.total > 0
        ? Math.round((this.state.completed / this.state.total) * 100)
        : 0;

    // Find active workers
    const activeWorkers = this.state.workers
      .map((w, i) => ({ ...w, index: i }))
      .filter((w) => w.status === 'processing');

    if (activeWorkers.length > 0) {
      const workerInfo = activeWorkers
        .map((w) => `[${w.index}] ${w.documentName ?? '-'} ${w.chunkNum}/${w.totalChunks}`)
        .join(' | ');
      this.output.write(
        `Progress: ${this.state.completed}/${this.state.total} (${pct}%) | ${workerInfo}\n`
      );
    }
  }

  /**
   * Formats a single worker line.
   *
   * @param index - Worker index
   * @param worker - Worker state
   * @returns Formatted line string
   */
  private formatWorkerLine(index: number, worker: WorkerState): string {
    const indexStr = `[${index}]`.padEnd(4);
    const bar = this.formatProgressBar(worker);
    const docName = this.formatDocName(worker.documentName);
    const chunkInfo = this.formatChunkInfo(worker);

    return `${indexStr} ${bar} ${docName} ${chunkInfo}`;
  }

  /**
   * Formats the ASCII progress bar for a worker.
   *
   * @param worker - Worker state
   * @returns Formatted progress bar string
   */
  private formatProgressBar(worker: WorkerState): string {
    let percent = 0;

    if (worker.status === 'done') {
      percent = 100;
    } else if (
      worker.status === 'processing' &&
      worker.totalChunks > 0 &&
      worker.chunkNum > 0
    ) {
      // Progress based on chunk completion (0-based, so chunkNum-1 completed)
      percent = Math.round(((worker.chunkNum - 1) / worker.totalChunks) * 100);
      // Clamp to valid range
      percent = Math.max(0, Math.min(100, percent));
    }

    const filled = Math.round((percent / 100) * this.barWidth);
    const empty = this.barWidth - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const pctStr = `${percent}%`.padStart(4);

    return `[${bar}] ${pctStr}`;
  }

  /**
   * Formats and truncates the document name.
   *
   * @param name - Document name or null
   * @returns Formatted document name
   */
  private formatDocName(name: string | null): string {
    if (!name) return '-'.padEnd(this.maxDocNameLength);

    if (name.length > this.maxDocNameLength) {
      return name.slice(0, this.maxDocNameLength - 3) + '...';
    }

    return name.padEnd(this.maxDocNameLength);
  }

  /**
   * Formats the chunk info with status icon.
   *
   * @param worker - Worker state
   * @returns Formatted chunk info string
   */
  private formatChunkInfo(worker: WorkerState): string {
    const icon = STATUS_ICONS[worker.status];

    switch (worker.status) {
      case 'idle':
        return `${icon} idle`;
      case 'waiting':
        return `${icon} wait`;
      case 'done':
        return `${icon} done`;
      case 'processing':
        return `${icon} ${worker.chunkNum}/${worker.totalChunks}`;
      default:
        return '';
    }
  }
}

/**
 * Creates a progress bar display, or returns null if not in a suitable environment.
 *
 * @param workerCount - Number of workers
 * @param options - Display options
 * @returns ProgressBarDisplay instance or null
 */
export function createProgressBarDisplay(
  workerCount: number,
  options?: ProgressBarDisplayOptions
): ProgressBarDisplay | null {
  // Disable fancy output in CI environments
  if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
    return null;
  }

  return new ProgressBarDisplay(workerCount, options);
}

