/**
 * Agent-in-the-Loop Testing - Agent Types
 * 
 * Type definitions for the configurable LLM agent harness.
 */

/**
 * Configuration for the LLM agent
 */
export interface AgentConfig {
  /** OpenRouter API key */
  apiKey: string;
  
  /** Model identifier (e.g., 'anthropic/claude-sonnet-4', 'openai/gpt-4o') */
  model: string;
  
  /** Temperature for generation (0.0 - 1.0) */
  temperature?: number;
  
  /** Maximum tokens in response */
  maxTokens?: number;
  
  /** Maximum number of tool call iterations */
  maxIterations?: number;
  
  /** Timeout per LLM call in milliseconds */
  timeoutMs?: number;
}

/**
 * Default agent configuration (model should be provided via config.ts)
 */
export const DEFAULT_AGENT_CONFIG: Partial<AgentConfig> = {
  temperature: 0.1,
  maxTokens: 4096,
  maxIterations: 10,
  timeoutMs: 60000,
};

/**
 * Represents a single tool call made by the agent
 */
export interface ToolCall {
  /** Tool name */
  name: string;
  
  /** Tool input arguments */
  arguments: Record<string, unknown>;
  
  /** Tool execution result */
  result: unknown;
  
  /** Whether the tool call succeeded */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Execution duration in milliseconds */
  durationMs: number;
  
  /** Timestamp of the call */
  timestamp: Date;
}

/**
 * Result of an agent execution
 */
export interface AgentExecutionResult {
  /** The agent's final answer/conclusion */
  answer: string;
  
  /** All tool calls made during execution */
  toolCalls: ToolCall[];
  
  /** Total number of LLM iterations */
  iterations: number;
  
  /** Whether the agent completed successfully */
  completed: boolean;
  
  /** Error if agent failed to complete */
  error?: string;
  
  /** Total execution time in milliseconds */
  totalDurationMs: number;
  
  /** Token usage statistics */
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Tool definition for the agent
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Tool executor function type
 */
export type ToolExecutor = (
  name: string,
  args: Record<string, unknown>
) => Promise<{ content: Array<{ text: string }>; isError: boolean }>;

/**
 * Message in the conversation
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

