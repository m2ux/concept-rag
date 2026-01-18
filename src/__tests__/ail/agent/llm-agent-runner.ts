/**
 * Agent-in-the-Loop Testing - LLM Agent Runner
 * 
 * Orchestrates LLM agent execution with tool access for AIL testing.
 * Uses OpenRouter API for LLM calls with configurable model selection.
 */

import * as fs from 'fs';
import * as path from 'path';
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
 * System prompt for the agent - kept minimal since detailed rules are injected via resources
 */
function loadSystemPrompt(): string {
  return `You are a research assistant with access to a document knowledge base.
Your task is to answer questions using ONLY information from the available tools.
You have already received research guidelines - follow them precisely.
NEVER narrate your search process. Just use tools and provide synthesized answers.`;
}

/**
 * LLM Agent Runner for AIL testing
 * 
 * Executes an LLM agent with access to MCP tools, recording all tool calls
 * and managing the conversation loop.
 */
export class LLMAgentRunner {
  private config: Required<AgentConfig>;
  private systemPrompt: string;
  
  constructor(config: AgentConfig) {
    this.config = {
      ...DEFAULT_AGENT_CONFIG,
      ...config,
    } as Required<AgentConfig>;
    this.systemPrompt = loadSystemPrompt();
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
    
    // Load guidance from prompts/guidance.md (skills interface replaces get_guidance tool)
    const guidancePath = path.resolve(process.cwd(), 'prompts/guidance.md');
    let guidanceContent = '';
    try {
      if (fs.existsSync(guidancePath)) {
        guidanceContent = fs.readFileSync(guidancePath, 'utf-8');
      }
    } catch {
      guidanceContent = '';
    }
    
    // Load IDE setup rules from prompt file
    const quickRulesPath = path.resolve(process.cwd(), 'prompts/ide-setup.md');
    let quickRules = '';
    try {
      if (fs.existsSync(quickRulesPath)) {
        quickRules = fs.readFileSync(quickRulesPath, 'utf-8');
      }
    } catch {
      // Fall back to basic rules if file not found
      quickRules = 'Use catalog_search to find documents, then chunks_search for content. Synthesize answers from results.';
    }
    
    // Inject compact guidance as a prior exchange
    messages.push({
      role: 'user',
      content: 'Please review these research guidelines before answering my question.',
    });
    messages.push({
      role: 'assistant',
      content: `I've reviewed the guidelines:\n\n${quickRules}\n\nReady for your question.`,
    });
    
    // Now add the actual user question
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
            { role: 'system', content: this.systemPrompt },
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

