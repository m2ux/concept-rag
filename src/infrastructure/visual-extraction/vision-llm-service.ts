/**
 * Vision LLM Service
 * 
 * Provides Vision LLM integration via OpenRouter for:
 * - Visual classification (diagram vs photo)
 * - Semantic description generation
 * 
 * Supports models with vision capabilities:
 * - anthropic/claude-3-5-haiku-20241022 (default - fast and cost-effective)
 * - anthropic/claude-sonnet-4
 * - openai/gpt-4o
 * - google/gemini-2.0-flash-001
 */

import { loadImageAsBase64 } from './image-processor.js';
import type { VisualType } from '../../domain/models/visual.js';
import type { DetectedVisual, BoundingBox } from './types.js';

/**
 * Configuration for Vision LLM service.
 */
export interface VisionLLMConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Classification result from Vision LLM.
 */
export interface ClassificationResult {
  /** Visual type or 'skip' if not a diagram */
  type: VisualType | 'skip';
  /** Confidence score (0-1) */
  confidence: number;
  /** Brief explanation */
  reason?: string;
}

/**
 * Description result from Vision LLM.
 */
export interface DescriptionResult {
  /** Semantic description of the visual */
  description: string;
  /** Visual type classification */
  type: VisualType;
  /** Key concepts identified in the visual */
  concepts: string[];
}

/**
 * Detection result for visuals on a page.
 */
export interface PageVisualDetectionResult {
  /** Detected visuals with bounding boxes */
  visuals: DetectedVisual[];
  /** Whether the page contains any visuals */
  hasVisuals: boolean;
}

import { Configuration } from '../../application/config/index.js';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_TIMEOUT_MS = 60000;

/**
 * Classification prompt for determining if an image is a diagram.
 */
const CLASSIFICATION_PROMPT = `Analyze this image from a technical document.

Classify it as ONE of:
- diagram: flowcharts, UML, architecture diagrams, state machines, sequence diagrams, dependency graphs
- flowchart: process flows, decision trees, workflow diagrams
- chart: bar charts, line graphs, pie charts, scatter plots, histograms
- table: structured tabular data, matrices
- figure: technical illustrations with labels, annotated diagrams
- skip: photographs, screenshots, decorative images, logos, icons, cover images

IMPORTANT: Only classify as diagram/flowchart/chart/table/figure if it has semantic technical meaning.
Photos, decorative elements, and non-technical images should be classified as "skip".

Respond with ONLY a JSON object:
{"type": "<type>", "confidence": <0-1>, "reason": "<brief reason>"}`;

/**
 * Description prompt for generating semantic description of a visual.
 */
const DESCRIPTION_PROMPT = `Describe this diagram from a technical document.

Focus on the SEMANTIC MEANING, not visual appearance:
1. What system, process, or concept does this diagram represent?
2. What are the key components or entities shown?
3. What relationships or flows are depicted?
4. What technical concepts does this illustrate?

Provide:
1. A concise description (2-4 sentences) capturing the semantic meaning
2. Classification as: diagram, flowchart, chart, table, or figure
3. Key technical concepts illustrated (3-8 concepts)

Respond with ONLY a JSON object:
{
  "description": "<semantic description>",
  "type": "<diagram|flowchart|chart|table|figure>",
  "concepts": ["concept1", "concept2", ...]
}`;

/**
 * Vision LLM Service for visual classification and description.
 */
export class VisionLLMService {
  private config: Required<VisionLLMConfig>;

  constructor(config: VisionLLMConfig) {
    if (!config.apiKey) {
      throw new Error('Vision LLM API key is required');
    }

    // Get default model from configuration
    const appConfig = Configuration.getInstance();
    const defaultModel = appConfig.llm.visionModel;

    this.config = {
      apiKey: config.apiKey,
      model: config.model || defaultModel,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      timeoutMs: config.timeoutMs || DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries || 2
    };
  }

  /**
   * Classify an image as diagram or skip.
   * 
   * @param imagePath - Path to the image file
   * @returns Classification result
   */
  async classifyImage(imagePath: string): Promise<ClassificationResult> {
    const imageBase64 = await loadImageAsBase64(imagePath);
    
    const response = await this.callVisionLLM(CLASSIFICATION_PROMPT, imageBase64);
    
    try {
      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('Failed to parse classification response:', response);
        return { type: 'skip', confidence: 0.5, reason: 'Parse error' };
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Validate type
      const validTypes = ['diagram', 'flowchart', 'chart', 'table', 'figure', 'skip'];
      const type = validTypes.includes(result.type) ? result.type : 'skip';
      
      return {
        type: type as VisualType | 'skip',
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
        reason: result.reason
      };
    } catch (error) {
      console.warn('Failed to parse classification response:', error);
      return { type: 'skip', confidence: 0.5, reason: 'Parse error' };
    }
  }

  /**
   * Generate semantic description of a visual.
   * 
   * @param imagePath - Path to the image file
   * @returns Description result
   */
  async describeVisual(imagePath: string): Promise<DescriptionResult> {
    const imageBase64 = await loadImageAsBase64(imagePath);
    
    const response = await this.callVisionLLM(DESCRIPTION_PROMPT, imageBase64);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize
      const validTypes = ['diagram', 'flowchart', 'chart', 'table', 'figure'];
      const type = validTypes.includes(result.type) ? result.type : 'diagram';
      
      return {
        description: result.description || 'Visual content from document',
        type: type as VisualType,
        concepts: Array.isArray(result.concepts) ? result.concepts : []
      };
    } catch (error) {
      console.warn('Failed to parse description response:', error);
      return {
        description: 'Visual content from document (description unavailable)',
        type: 'diagram',
        concepts: []
      };
    }
  }

  /**
   * Call the Vision LLM API.
   * 
   * @param prompt - Text prompt
   * @param imageBase64 - Base64-encoded image with data URL prefix
   * @returns Response text
   */
  private async callVisionLLM(prompt: string, imageBase64: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/m2ux/concept-rag',
          'X-Title': 'Concept-RAG Visual Extraction'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 1024
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision LLM API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };

      return data.choices[0]?.message?.content || '';
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Create a Vision LLM service from environment/configuration.
 */
export function createVisionLLMService(
  options: {
    apiKey?: string;
    model?: string;
  } = {}
): VisionLLMService {
  const config = Configuration.getInstance();
  const apiKey = options.apiKey || config.llm.apiKey;
  
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY environment variable is required for Vision LLM.\n' +
      'Get an API key from https://openrouter.ai/'
    );
  }

  return new VisionLLMService({
    apiKey,
    model: options.model  // Will use config default if undefined
  });
}

