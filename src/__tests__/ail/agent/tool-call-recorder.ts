/**
 * Agent-in-the-Loop Testing - Tool Call Recorder
 * 
 * Records all tool calls made by the agent for analysis.
 */

import { ToolCall, ToolExecutor } from './types.js';

/**
 * Wraps a tool executor to record all tool calls
 */
export class ToolCallRecorder {
  private toolCalls: ToolCall[] = [];
  
  constructor(private executor: ToolExecutor) {}
  
  /**
   * Execute a tool and record the call
   */
  async execute(
    name: string,
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ text: string }>; isError: boolean }> {
    const startTime = Date.now();
    const timestamp = new Date();
    
    try {
      const result = await this.executor(name, args);
      const durationMs = Date.now() - startTime;
      
      this.toolCalls.push({
        name,
        arguments: args,
        result: result.content.map(c => c.text).join('\n'),
        success: !result.isError,
        durationMs,
        timestamp,
      });
      
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.toolCalls.push({
        name,
        arguments: args,
        result: null,
        success: false,
        error: errorMessage,
        durationMs,
        timestamp,
      });
      
      return {
        content: [{ text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
  
  /**
   * Get all recorded tool calls
   */
  getToolCalls(): ToolCall[] {
    return [...this.toolCalls];
  }
  
  /**
   * Get tool calls by name
   */
  getToolCallsByName(name: string): ToolCall[] {
    return this.toolCalls.filter(tc => tc.name === name);
  }
  
  /**
   * Get unique tool names used
   */
  getUniqueToolNames(): string[] {
    return Array.from(new Set(this.toolCalls.map(tc => tc.name)));
  }
  
  /**
   * Get total tool call count
   */
  getToolCallCount(): number {
    return this.toolCalls.length;
  }
  
  /**
   * Get successful tool call count
   */
  getSuccessfulCallCount(): number {
    return this.toolCalls.filter(tc => tc.success).length;
  }
  
  /**
   * Reset the recorder
   */
  reset(): void {
    this.toolCalls = [];
  }
}

