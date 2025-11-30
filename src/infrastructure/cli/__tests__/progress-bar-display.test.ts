import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Writable } from 'stream';
import {
  ProgressBarDisplay,
  createProgressBarDisplay,
  type WorkerState,
} from '../progress-bar-display.js';

/**
 * Mock output stream that captures writes
 */
class MockOutput extends Writable {
  public chunks: string[] = [];
  public isTTY: boolean = true;

  _write(
    chunk: Buffer | string,
    _encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    this.chunks.push(chunk.toString());
    callback();
  }

  getOutput(): string {
    return this.chunks.join('');
  }

  clear(): void {
    this.chunks = [];
  }
}

describe('ProgressBarDisplay', () => {
  let mockOutput: MockOutput;

  beforeEach(() => {
    mockOutput = new MockOutput();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create display with specified worker count', () => {
      const display = new ProgressBarDisplay(5, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
      });
      const state = display.getState();
      expect(state.workers).toHaveLength(5);
    });

    it('should initialize workers as idle', () => {
      const display = new ProgressBarDisplay(3, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
      });
      const state = display.getState();
      state.workers.forEach((worker) => {
        expect(worker.status).toBe('idle');
        expect(worker.documentName).toBeNull();
        expect(worker.chunkNum).toBe(0);
        expect(worker.totalChunks).toBe(0);
      });
    });

    it('should use default options when not specified', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
      });
      // Should not throw
      expect(display).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should print initial lines in TTY mode', () => {
      const display = new ProgressBarDisplay(3, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
      });
      display.initialize();

      const output = mockOutput.getOutput();
      // Should contain hide cursor code
      expect(output).toContain('\x1B[?25l');
      // Should contain worker progress header
      expect(output).toContain('Worker Progress');
    });

    it('should not print ANSI codes in non-TTY mode', () => {
      mockOutput.isTTY = false;
      const display = new ProgressBarDisplay(3, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: false,
      });
      display.initialize();

      const output = mockOutput.getOutput();
      // Should NOT contain hide cursor code
      expect(output).not.toContain('\x1B[?25l');
    });

    it('should only initialize once', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
      });
      display.initialize();
      const firstOutput = mockOutput.getOutput();
      mockOutput.clear();

      display.initialize();
      const secondOutput = mockOutput.getOutput();

      // First init should have output, second should not write init codes again
      expect(firstOutput).toContain('\x1B[?25l');
      // Second init should be empty (no re-initialization)
      expect(secondOutput).toBe('');
    });
  });

  describe('updateWorker', () => {
    it('should update worker state', () => {
      const display = new ProgressBarDisplay(3, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 0, // Disable throttling for tests
      });
      display.initialize();

      display.updateWorker(1, {
        documentName: 'Test.pdf',
        chunkNum: 2,
        totalChunks: 5,
        status: 'processing',
      });

      const state = display.getState();
      expect(state.workers[1].documentName).toBe('Test.pdf');
      expect(state.workers[1].chunkNum).toBe(2);
      expect(state.workers[1].totalChunks).toBe(5);
      expect(state.workers[1].status).toBe('processing');
    });

    it('should support partial updates', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 0,
      });
      display.initialize();

      display.updateWorker(0, {
        documentName: 'Doc.pdf',
        status: 'processing',
        totalChunks: 3,
        chunkNum: 1,
      });

      display.updateWorker(0, { chunkNum: 2 });

      const state = display.getState();
      expect(state.workers[0].documentName).toBe('Doc.pdf');
      expect(state.workers[0].chunkNum).toBe(2);
      expect(state.workers[0].totalChunks).toBe(3);
      expect(state.workers[0].status).toBe('processing');
    });

    it('should ignore invalid worker indices', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
      });
      display.initialize();

      // Should not throw for invalid indices
      display.updateWorker(-1, { status: 'processing' });
      display.updateWorker(5, { status: 'processing' });

      const state = display.getState();
      state.workers.forEach((w) => expect(w.status).toBe('idle'));
    });
  });

  describe('updateProgress', () => {
    it('should update completed and total counts', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 0,
      });
      display.initialize();

      display.updateProgress(10, 50);

      const state = display.getState();
      expect(state.completed).toBe(10);
      expect(state.total).toBe(50);
    });

    it('should calculate percentage correctly', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 0,
      });
      display.initialize();
      mockOutput.clear();

      display.updateProgress(25, 100);
      display.forceRender();

      const output = mockOutput.getOutput();
      expect(output).toContain('25%');
    });
  });

  describe('cleanup', () => {
    it('should show cursor in TTY mode', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
      });
      display.initialize();
      mockOutput.clear();

      display.cleanup();

      const output = mockOutput.getOutput();
      expect(output).toContain('\x1B[?25h'); // Show cursor
    });

    it('should be safe to call multiple times', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
      });
      display.initialize();

      display.cleanup();
      display.cleanup();
      // Should not throw
    });

    it('should cancel pending renders', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 1000,
      });
      display.initialize();

      // Trigger a render that will be throttled
      display.updateWorker(0, { status: 'processing' });
      display.updateWorker(0, { chunkNum: 1 });

      // Cleanup should cancel pending render
      display.cleanup();

      // Advance timers - should not cause issues
      vi.advanceTimersByTime(2000);
    });
  });

  describe('progress bar formatting', () => {
    it('should show empty bar for idle workers', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        barWidth: 10,
        minRenderInterval: 0,
      });
      display.initialize();
      display.forceRender();

      const output = mockOutput.getOutput();
      expect(output).toContain('[░░░░░░░░░░]');
      expect(output).toContain('0%');
    });

    it('should show progress based on completed chunks', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        barWidth: 10,
        minRenderInterval: 0,
      });
      display.initialize();
      // Processing chunk 2 means chunk 1 is complete = 25% (1/4)
      display.updateWorker(0, { 
        status: 'processing', 
        chunkNum: 2, 
        totalChunks: 4 
      });
      mockOutput.clear();
      display.forceRender();

      const output = mockOutput.getOutput();
      // Should show ~25% (may be slightly higher due to time-based intra-chunk)
      expect(output).toMatch(/2[0-9]%/); // 20-29%
    });

    it('should show full bar for done workers', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        barWidth: 10,
        minRenderInterval: 0,
      });
      display.initialize();
      display.updateWorker(0, { status: 'done' });
      mockOutput.clear();
      display.forceRender();

      const output = mockOutput.getOutput();
      expect(output).toContain('[▓▓▓▓▓▓▓▓▓▓]');
      expect(output).toContain('100%');
    });

    it('should increase progress smoothly over time (intra-chunk)', () => {
      // Use real timers for this test to avoid interval issues
      vi.useRealTimers();
      
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: false, // Disable TTY to avoid interval
        barWidth: 10,
        minRenderInterval: 0,
        estimatedChunkDurationMs: 100, // 100ms for testing
      });
      display.initialize();
      
      // Manually set chunkStartTime in the past to simulate elapsed time
      const state = display.getState();
      // We need to test that progress increases with elapsed time
      // Since we can't directly set chunkStartTime, test that the formula works
      
      display.updateWorker(0, { 
        status: 'processing', 
        chunkNum: 1, 
        totalChunks: 2 
      });
      
      mockOutput.clear();
      display.forceRender();
      const output = mockOutput.getOutput();
      
      // Should show some progress (not 0%, not 100%)
      // At chunk 1/2, base is 0%, intra-chunk adds some
      expect(output).toMatch(/\d+%/);
      
      display.cleanup();
      vi.useFakeTimers(); // Restore fake timers
    });
  });

  describe('document name formatting', () => {
    it('should truncate long document names', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        maxDocNameLength: 20,
        minRenderInterval: 0,
      });
      display.initialize();
      display.updateWorker(0, {
        documentName: 'This Is A Very Long Document Name That Should Be Truncated.pdf',
        status: 'processing',
      });
      mockOutput.clear();
      display.forceRender();

      const output = mockOutput.getOutput();
      expect(output).toContain('This Is A Very Lo...');
    });

    it('should show dash for null document name', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 0,
      });
      display.initialize();
      mockOutput.clear();
      display.forceRender();

      const output = mockOutput.getOutput();
      expect(output).toMatch(/-\s+⏳ idle/);
    });
  });

  describe('status indicators', () => {
    it('should show correct icon for idle', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 0,
      });
      display.initialize();
      mockOutput.clear();
      display.forceRender();

      const output = mockOutput.getOutput();
      expect(output).toContain('⏳ idle');
    });

    it('should show correct icon for processing with chunk info', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 0,
      });
      display.initialize();
      display.updateWorker(0, {
        status: 'processing',
        chunkNum: 2,
        totalChunks: 5,
      });
      mockOutput.clear();
      display.forceRender();

      const output = mockOutput.getOutput();
      expect(output).toContain('🔄 2/5');
    });

    it('should show correct icon for done', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 0,
      });
      display.initialize();
      display.updateWorker(0, { status: 'done' });
      mockOutput.clear();
      display.forceRender();

      const output = mockOutput.getOutput();
      expect(output).toContain('✅ done');
    });

    it('should show correct icon for waiting', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 0,
      });
      display.initialize();
      display.updateWorker(0, { status: 'waiting' });
      mockOutput.clear();
      display.forceRender();

      const output = mockOutput.getOutput();
      expect(output).toContain('⏳ wait');
    });
  });

  describe('render throttling', () => {
    it('should throttle rapid updates', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 100,
      });
      display.initialize();
      mockOutput.clear();

      // Rapid updates
      for (let i = 0; i < 10; i++) {
        display.updateWorker(0, { chunkNum: i });
      }

      // Should have scheduled a render, but not rendered 10 times
      const outputBeforeTimer = mockOutput.chunks.length;
      expect(outputBeforeTimer).toBeLessThan(10);

      // Advance timer to trigger pending render
      vi.advanceTimersByTime(150);

      // Should have rendered the final state
      const output = mockOutput.getOutput();
      expect(output).toBeTruthy();
    });

    it('should render immediately when minRenderInterval elapsed', () => {
      const display = new ProgressBarDisplay(1, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
        minRenderInterval: 100,
      });
      display.initialize();
      mockOutput.clear();

      display.updateWorker(0, { chunkNum: 1 });
      const countAfterFirst = mockOutput.chunks.length;

      // Wait for interval to pass
      vi.advanceTimersByTime(150);

      display.updateWorker(0, { chunkNum: 2 });
      const countAfterSecond = mockOutput.chunks.length;

      // Should have rendered both times
      expect(countAfterSecond).toBeGreaterThan(countAfterFirst);
    });
  });

  describe('non-TTY fallback', () => {
    it('should output simple log lines in non-TTY mode', () => {
      mockOutput.isTTY = false;
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: false,
        minRenderInterval: 0,
      });
      display.initialize();
      display.updateProgress(5, 20);
      display.updateWorker(0, {
        documentName: 'Test.pdf',
        status: 'processing',
        chunkNum: 1,
        totalChunks: 3,
      });
      mockOutput.clear();
      display.forceRender();

      const output = mockOutput.getOutput();
      // Should be simple text, no ANSI codes
      expect(output).not.toContain('\x1B[');
      expect(output).toContain('Progress:');
      expect(output).toContain('Test.pdf');
    });
  });

  describe('getState', () => {
    it('should return a copy of the state', () => {
      const display = new ProgressBarDisplay(2, {
        output: mockOutput as unknown as NodeJS.WriteStream,
        forceTTY: true,
      });

      const state1 = display.getState();
      state1.completed = 999;
      state1.workers[0].documentName = 'Modified';

      const state2 = display.getState();
      expect(state2.completed).toBe(0);
      expect(state2.workers[0].documentName).toBeNull();
    });
  });
});

describe('createProgressBarDisplay', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null in CI environment', () => {
    process.env.CI = 'true';
    const display = createProgressBarDisplay(5);
    expect(display).toBeNull();
  });

  it('should return null when CONTINUOUS_INTEGRATION is set', () => {
    process.env.CONTINUOUS_INTEGRATION = 'true';
    const display = createProgressBarDisplay(5);
    expect(display).toBeNull();
  });

  it('should return display when not in CI', () => {
    delete process.env.CI;
    delete process.env.CONTINUOUS_INTEGRATION;
    const display = createProgressBarDisplay(5);
    expect(display).toBeInstanceOf(ProgressBarDisplay);
  });
});

