/**
 * Agent-in-the-Loop Testing - LLM Agent Runner
 * 
 * Orchestrates LLM agent execution with tool access for AIL testing.
 * Uses OpenRouter API for LLM calls with configurable model selection.
 */

import {
  AgentConfig,
  AgentExecutionResult,
  ConversationMessage,
  DEFAULT_AGENT_CONFIG,
  ToolCall,
  ToolDefinition,
} from './types.js';
import { ToolCallRecorder } from './tool-call-recorder.js';

/**
 * System prompt for the agent during AIL testing
 */
const SYSTEM_PROMPT = `You are a research assistant with access to a document knowledge base through specialized tools.

Your task is to answer the user's question using ONLY information from the available tools. Follow these guidelines:

1. **Tool Selection**: Choose the most appropriate tool for each step:
   - Use \`catalog_search\` to find documents by title, author, or topic
   - Use \`broad_chunks_search\` for comprehensive cross-document research
   - Use \`chunks_search\` when you know the specific document to search within
   - Use \`concept_search\` for tracking specific concepts across documents
   - Use \`list_categories\` to see available subject areas
   - Use \`category_search\` to browse documents in a category

2. **Efficient Searching**: Start with discovery tools, then narrow down:
   - catalog_search → chunks_search (find doc, then search within)
   - list_categories → category_search (explore domains)

3. **Answer Format**: Provide a clear, direct answer based on the tool results.
   - Cite sources when possible
   - If information is not found, say so clearly

4. **Completion**: When you have sufficient information to answer, provide your final answer.
   Do not make additional tool calls after you have the answer.`;

/**
 * LLM Agent Runner for AIL testing
 * 
 * Executes an LLM agent with access to MCP tools, recording all tool calls
 * and managing the conversation loop.
 */
export class LLMAgentRunner {
  private config: Required<AgentConfig>;
  
  constructor(config: AgentConfig) {
    this.config = {
      ...DEFAULT_AGENT_CONFIG,
      ...config,
    } as Required<AgentConfig>;
  }
  
  /**
   * Execute the agent with a goal and available tools
   * 
   * @param goal - The question/task for the agent to complete
   * @param tools - Available tool definitions
   * @param recorder - Tool call recorder with executor
   * @returns Execution result with answer, tool calls, and metrics
   */
  async execute(
    goal: string,
    tools: ToolDefinition[],
    recorder: ToolCallRecorder
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const messages: ConversationMessage[] = [];
    let iterations = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    
    // Initial user message with the goal
    messages.push({
      role: 'user',
      content: goal,
    });
    
    try {
      while (iterations < this.config.maxIterations) {
        iterations++;
        
        // Call LLM with current conversation
        const response = await this.callLLM(messages, tools);
        
        // Track token usage
        if (response.usage) {
          totalPromptTokens += response.usage.prompt_tokens || 0;
          totalCompletionTokens += response.usage.completion_tokens || 0;
        }
        
        const assistantMessage = response.choices[0]?.message;
        if (!assistantMessage) {
          throw new Error('No response from LLM');
        }
        
        // Check for tool calls
        const toolCalls = assistantMessage.tool_calls;
        
        if (toolCalls && toolCalls.length > 0) {
          // Add assistant message with tool calls
          messages.push({
            role: 'assistant',
            content: assistantMessage.content || '',
            toolCalls: toolCalls.map(tc => ({
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments,
              },
            })),
          });
          
          // Execute each tool call and add results
          for (const toolCall of toolCalls) {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await recorder.execute(toolCall.function.name, args);
            
            messages.push({
              role: 'tool',
              content: result.content.map(c => c.text).join('\n'),
              toolCallId: toolCall.id,
            });
          }
        } else {
          // No tool calls - agent is providing final answer
          const answer = assistantMessage.content || '';
          
          return {
            answer,
            toolCalls: recorder.getToolCalls(),
            iterations,
            completed: true,
            totalDurationMs: Date.now() - startTime,
            tokenUsage: {
              promptTokens: totalPromptTokens,
              completionTokens: totalCompletionTokens,
              totalTokens: totalPromptTokens + totalCompletionTokens,
            },
          };
        }
      }
      
      // Max iterations reached
      return {
        answer: this.extractLastContent(messages),
        toolCalls: recorder.getToolCalls(),
        iterations,
        completed: false,
        error: `Max iterations (${this.config.maxIterations}) reached`,
        totalDurationMs: Date.now() - startTime,
        tokenUsage: {
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          totalTokens: totalPromptTokens + totalCompletionTokens,
        },
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        answer: '',
        toolCalls: recorder.getToolCalls(),
        iterations,
        completed: false,
        error: errorMessage,
        totalDurationMs: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Call the LLM API via OpenRouter
   */
  private async callLLM(
    messages: ConversationMessage[],
    tools: ToolDefinition[]
  ): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/m2ux/concept-rag',
          'X-Title': 'Concept-RAG AIL Testing',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...this.formatMessages(messages),
          ],
          tools: this.formatTools(tools),
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${errorText}`);
      }
      
      return await response.json() as OpenRouterResponse;
      
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Format conversation messages for the API
   */
  private formatMessages(messages: ConversationMessage[]): ApiMessage[] {
    return messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: msg.toolCallId!,
          content: msg.content,
        };
      }
      
      if (msg.role === 'assistant' && msg.toolCalls) {
        return {
          role: 'assistant',
          content: msg.content,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        };
      }
      
      return {
        role: msg.role,
        content: msg.content,
      };
    });
  }
  
  /**
   * Format tools for the API
   */
  private formatTools(tools: ToolDefinition[]): ApiTool[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }
  
  /**
   * Extract the last content from messages (fallback for max iterations)
   */
  private extractLastContent(messages: ConversationMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].content) {
        return messages[i].content;
      }
    }
    return '';
  }
}

// API types for OpenRouter
interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface ApiMessage {
  role: string;
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface ApiTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

