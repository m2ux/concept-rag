/**
 * Agent-in-the-Loop Testing - Accuracy Evaluator
 * 
 * Uses LLM-as-judge to evaluate whether the agent's answer is correct
 * compared to the ground truth.
 */

import { AccuracyResult, AccuracyEvaluatorConfig, GroundTruth } from './types.js';
import { getAILConfig } from '../config.js';

const EVALUATION_PROMPT = `You are an evaluation judge assessing whether an AI agent's answer correctly addresses a question based on ground truth information.

## Question
{question}

## Ground Truth Key Points
{keyPoints}

## Agent's Answer
{answer}

## Your Task
Evaluate whether the agent's answer correctly covers the ground truth key points.

Respond in JSON format:
{
  "correct": true/false,
  "confidence": 0.0-1.0,
  "explanation": "Brief explanation of your evaluation",
  "coveredPoints": ["list of key points that were covered"],
  "missedPoints": ["list of key points that were missed"]
}

Rules:
- "correct" is true if the answer covers the essential key points (doesn't need to be word-for-word)
- "confidence" reflects how confident you are in your evaluation
- An answer can be correct even if it includes additional relevant information
- An answer is incorrect if it contradicts the ground truth or misses critical points
- Partial coverage may still be correct if the core information is present`;

/**
 * Evaluates answer accuracy using LLM-as-judge
 */
export class AccuracyEvaluator {
  private config: Required<AccuracyEvaluatorConfig>;
  
  constructor(config: AccuracyEvaluatorConfig) {
    const ailConfig = getAILConfig();
    this.config = {
      model: ailConfig.evalModel,
      temperature: 0.1,
      ...config,
    };
  }
  
  /**
   * Evaluate the accuracy of an agent's answer
   * 
   * @param question - The original question
   * @param answer - The agent's answer
   * @param groundTruth - The ground truth to compare against
   * @returns Accuracy evaluation result
   */
  async evaluate(
    question: string,
    answer: string,
    groundTruth: GroundTruth
  ): Promise<AccuracyResult> {
    // Handle empty answers
    if (!answer || answer.trim().length === 0) {
      return {
        correct: false,
        confidence: 1.0,
        explanation: 'Agent provided no answer',
        coveredPoints: [],
        missedPoints: groundTruth.keyPoints,
      };
    }
    
    const prompt = EVALUATION_PROMPT
      .replace('{question}', question)
      .replace('{keyPoints}', groundTruth.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n'))
      .replace('{answer}', answer);
    
    try {
      const response = await this.callLLM(prompt);
      return this.parseEvaluationResponse(response, groundTruth);
    } catch (error) {
      // Fallback to simple heuristic evaluation
      return this.heuristicEvaluation(answer, groundTruth);
    }
  }
  
  /**
   * Call the LLM for evaluation
   */
  private async callLLM(prompt: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/m2ux/concept-rag',
        'X-Title': 'Concept-RAG AIL Evaluation',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: this.config.temperature,
        max_tokens: 1024,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Evaluation API error: ${response.status}`);
    }
    
    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    
    return data.choices[0]?.message?.content || '';
  }
  
  /**
   * Parse the LLM evaluation response
   */
  private parseEvaluationResponse(
    response: string,
    groundTruth: GroundTruth
  ): AccuracyResult {
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]) as {
        correct: boolean;
        confidence: number;
        explanation: string;
        coveredPoints: string[];
        missedPoints: string[];
      };
      
      return {
        correct: parsed.correct,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        explanation: parsed.explanation,
        coveredPoints: parsed.coveredPoints || [],
        missedPoints: parsed.missedPoints || [],
      };
    } catch {
      // If parsing fails, fall back to heuristic
      return this.heuristicEvaluation(response, groundTruth);
    }
  }
  
  /**
   * Simple heuristic evaluation as fallback
   */
  private heuristicEvaluation(
    answer: string,
    groundTruth: GroundTruth
  ): AccuracyResult {
    const lowerAnswer = answer.toLowerCase();
    const coveredPoints: string[] = [];
    const missedPoints: string[] = [];
    
    for (const point of groundTruth.keyPoints) {
      // Check if key words from the point appear in the answer
      const words = point.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matchedWords = words.filter(w => lowerAnswer.includes(w));
      const coverage = matchedWords.length / words.length;
      
      if (coverage >= 0.5) {
        coveredPoints.push(point);
      } else {
        missedPoints.push(point);
      }
    }
    
    const coverageRatio = coveredPoints.length / groundTruth.keyPoints.length;
    
    return {
      correct: coverageRatio >= 0.6,
      confidence: 0.5, // Lower confidence for heuristic evaluation
      explanation: `Heuristic evaluation: ${coveredPoints.length}/${groundTruth.keyPoints.length} key points covered`,
      coveredPoints,
      missedPoints,
    };
  }
}

