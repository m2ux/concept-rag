/**
 * Get Guidance MCP Tool
 * 
 * Returns agent guidance rules for effective use of concept-rag tools.
 * Agents should call this FIRST before starting any research task.
 */

import { BaseTool, ToolParams } from '../base/tool.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

export interface GetGuidanceParams extends ToolParams {
  topic?: 'rules' | 'tool-selection' | 'all';
}

export class GetGuidanceTool extends BaseTool<GetGuidanceParams> {
  
  name = "get_guidance";
  
  description = `Get agent guidance for using concept-rag tools effectively. **Call this FIRST before starting any research task.**

USE THIS TOOL WHEN:
- Starting a new research session or task
- Unsure how to approach a complex query
- Need to review best practices for answer synthesis
- Want to understand which tool to use for a specific task type

RETURNS: Guidance documents including:
- Agent research rules (answer synthesis, efficiency, stopping criteria)
- Tool selection guide (decision tree for all 10 tools)

RECOMMENDED: Call with topic='rules' at the start of each session to ensure high-quality answers.`;

  inputSchema = {
    type: "object" as const,
    properties: {
      topic: {
        type: "string",
        enum: ["rules", "tool-selection", "all"],
        description: "Which guidance to retrieve: 'rules' for agent behavior rules, 'tool-selection' for the tool decision tree, 'all' for both (default: 'rules')"
      }
    },
    required: []
  };
  
  async execute(params: GetGuidanceParams) {
    const topic = params.topic || 'rules';
    
    const results: string[] = [];
    
    try {
      if (topic === 'rules' || topic === 'all') {
        const rulesPath = path.resolve(PROJECT_ROOT, 'prompts/get-guidance.md');
        if (fs.existsSync(rulesPath)) {
          const rules = fs.readFileSync(rulesPath, 'utf-8');
          results.push('# Agent Research Rules\n\n' + rules);
        } else {
          results.push('# Agent Research Rules\n\n(File not found: prompts/get-guidance.md)');
        }
      }
      
      if (topic === 'tool-selection' || topic === 'all') {
        const guidePath = path.resolve(PROJECT_ROOT, 'docs/tool-selection-guide.md');
        if (fs.existsSync(guidePath)) {
          const guide = fs.readFileSync(guidePath, 'utf-8');
          results.push('# Tool Selection Guide\n\n' + guide);
        } else {
          results.push('# Tool Selection Guide\n\n(File not found: docs/tool-selection-guide.md)');
        }
      }
      
      const content = results.join('\n\n---\n\n');
      
      return {
        content: [{ type: "text" as const, text: content }],
        isError: false
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify({ error: message }) 
        }],
        isError: true
      };
    }
  }
}

