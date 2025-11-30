import { Document } from "@langchain/core/documents";
import { ConceptMetadata, ExtractedConcept } from "./types.js";
import { buildConceptExtractionPrompt } from "../config.js";
import * as fs from "fs";
import type { ResilientExecutor } from "../infrastructure/resilience/resilient-executor.js";
import { ResilienceProfiles } from "../infrastructure/resilience/resilient-executor.js";
import type { SharedRateLimiter } from "../infrastructure/utils/shared-rate-limiter.js";

export interface ConceptExtractorOptions {
    /** Optional resilient executor for circuit breaker, retry, and timeout protection */
    resilientExecutor?: ResilientExecutor;
    /** Optional shared rate limiter for coordinating across multiple extractors */
    sharedRateLimiter?: SharedRateLimiter;
    /** Optional label for log messages (e.g., document name) */
    sourceLabel?: string;
    /** Optional callback for chunk progress updates (for overwriting progress line) */
    onChunkProgress?: (chunkNum: number, totalChunks: number) => void;
}

export class ConceptExtractor {
    
    private openRouterApiKey: string;
    private lastRequestTime: number = 0;
    private minRequestInterval: number = 3000; // 3 seconds between requests
    private resilientExecutor?: ResilientExecutor;
    private sharedRateLimiter?: SharedRateLimiter;
    private sourceLabel?: string;
    private headerPrinted: boolean = false;
    private onChunkProgress?: (chunkNum: number, totalChunks: number) => void;
    
    /**
     * @param apiKey - OpenRouter API key
     * @param options - Optional configuration (resilientExecutor, sharedRateLimiter, sourceLabel)
     */
    constructor(apiKey: string, options?: ConceptExtractorOptions | ResilientExecutor) {
        this.openRouterApiKey = apiKey;
        
        // Support both old signature (resilientExecutor) and new options object
        if (options) {
            if ('execute' in options) {
                // Old signature: passed ResilientExecutor directly
                this.resilientExecutor = options as ResilientExecutor;
            } else {
                // New signature: options object
                const opts = options as ConceptExtractorOptions;
                this.resilientExecutor = opts.resilientExecutor;
                this.sharedRateLimiter = opts.sharedRateLimiter;
                this.sourceLabel = opts.sourceLabel;
                this.onChunkProgress = opts.onChunkProgress;
            }
        }
    }
    
    /** Print document header once before first log message */
    private printHeaderIfNeeded(): void {
        if (this.sourceLabel && !this.headerPrinted) {
            console.log(`📄 ${this.sourceLabel}`);
            this.headerPrinted = true;
        }
    }
    
    private async rateLimitDelay(): Promise<void> {
        // If using shared rate limiter, use it instead of internal timing
        if (this.sharedRateLimiter) {
            await this.sharedRateLimiter.acquire();
            return;
        }
        
        // Internal rate limiting (for standalone usage)
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            const delayNeeded = this.minRequestInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delayNeeded));
        }
        this.lastRequestTime = Date.now();
    }
    
    async checkRateLimits(): Promise<void> {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/key', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.openRouterApiKey}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const { limit_remaining } = data.data;
                
                // Only show warning if credits are low
                if (limit_remaining !== null && limit_remaining < 1) {
                    console.warn(`  ⚠️  WARNING: Low/no credits remaining!`);
                }
            }
        } catch (error) {
            // Don't fail extraction if rate limit check fails
        }
    }
    
    // Extract concepts from document using LLM
    async extractConcepts(docs: Document[]): Promise<ConceptMetadata> {
        const fullContent = this.sampleContent(docs);
        const estimatedTokens = Math.ceil(fullContent.length / 4);
        
        // Split large documents (>100k tokens) into multiple chunks
        const tokenLimit = 100000; // 100k token limit for splitting
        
        if (estimatedTokens > tokenLimit) {
            this.printHeaderIfNeeded();
            return await this.extractConceptsMultiPass(fullContent, tokenLimit, estimatedTokens);
        }
        
        // Regular extraction for smaller documents
        this.printHeaderIfNeeded();
        return await this.extractConceptsSinglePass(fullContent);
    }
    
    // Multi-pass extraction for large documents
    private async extractConceptsMultiPass(content: string, tokenLimit: number, estimatedTokens?: number): Promise<ConceptMetadata> {
        const charsPerToken = 4;
        const charLimit = tokenLimit * charsPerToken; // ~400k chars per chunk
        
        const chunks: string[] = [];
        for (let i = 0; i < content.length; i += charLimit) {
            chunks.push(content.slice(i, i + charLimit));
        }
        
        const allExtractions: ConceptMetadata[] = [];
        
        // Extract concepts from each chunk
        for (let i = 0; i < chunks.length; i++) {
            // Use callback if provided (for inline progress updates), otherwise log normally
            if (this.onChunkProgress) {
                this.onChunkProgress(i + 1, chunks.length);
            } else {
                const tokenInfo = estimatedTokens ? ` (${Math.round(estimatedTokens / 1000)}k tokens)` : '';
                console.log(`  🔄 Processing chunk ${i + 1}/${chunks.length}${tokenInfo}...`);
            }
            const extracted = await this.extractConceptsFromChunk(chunks[i]);
            allExtractions.push(extracted);
        }
        
        // Merge all extractions
        return this.mergeConceptExtractions(allExtractions);
    }
    
    // Extract concepts from a chunk with retry logic
    private async extractConceptsFromChunk(chunk: string, maxRetries: number = 3): Promise<ConceptMetadata> {
        const estimatedTokens = Math.ceil(chunk.length / 4) + 1000;
        const contextLimit = 400000; // gpt-5-mini has 400k context
        const safetyBuffer = 10000;
        const calculatedMaxTokens = contextLimit - estimatedTokens - safetyBuffer;
        const maxTokens = Math.max(Math.min(calculatedMaxTokens, 65536), 16); // Ensure >= 16
        
        // Build prompt from template file
        const prompt = buildConceptExtractionPrompt(chunk);
        
        let lastError: Error | null = null;
        let lastResponse: string | undefined;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.callOpenRouter(prompt, maxTokens);
                lastResponse = response;
                
                // Parse response with better error recovery
                let jsonText = response.trim();
                
                // Remove markdown code blocks if present
                if (jsonText.includes('```')) {
                    const jsonMatch = jsonText.match(/```json?\s*([\s\S]*?)\s*```/);
                    if (jsonMatch) {
                        jsonText = jsonMatch[1].trim();
                    } else {
                        // Fallback: remove all ``` markers
                        jsonText = jsonText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
                    }
                }
                
                // Try to fix common JSON issues before parsing
                jsonText = this.sanitizeJSON(jsonText);
                
                const concepts = JSON.parse(jsonText);
                
                // Parse primary_concepts - handle both new (object[]) and legacy (string[]) formats
                let primaryConcepts: (ExtractedConcept | string)[] = [];
                if (Array.isArray(concepts.primary_concepts)) {
                    primaryConcepts = concepts.primary_concepts
                        .filter((c: any) => c != null)
                        .map((c: any) => {
                            if (typeof c === 'string') {
                                // Legacy format: string only
                                return c.trim() ? c : null;
                            } else if (typeof c === 'object' && c.name) {
                                // New format: object with name and summary
                                return {
                                    name: String(c.name).trim(),
                                    summary: String(c.summary || '').trim()
                                } as ExtractedConcept;
                            }
                            return null;
                        })
                        .filter((c: any) => c != null);
                }
                
                // Success - return the result
                if (attempt > 1) {
                    console.log(`  ✅ Retry ${attempt} succeeded`);
                }
                
                return {
                    primary_concepts: primaryConcepts,
                    categories: Array.isArray(concepts.categories) 
                        ? concepts.categories.filter((c: any) => typeof c === 'string' && c.trim()) 
                        : []
                };
            } catch (error: any) {
                lastError = error;
                
                // Check if this is a retryable error
                const isRetryable = error.message?.includes('terminated') || 
                                   error.message?.includes('timeout') ||
                                   error.message?.includes('ECONNRESET') ||
                                   error.message?.includes('network') ||
                                   error.message?.includes('Bad control character');
                
                if (isRetryable && attempt < maxRetries) {
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 1s, 2s, 4s... max 10s
                    console.warn(`  ⚠️  Chunk extraction failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
                    console.warn(`  🔄 Retrying in ${backoffMs / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                    continue;
                }
                
                // Non-retryable error or max retries reached
                break;
            }
        }
        
        // All retries failed - log and return empty
        console.warn(`  ⚠️  Chunk extraction failed after ${maxRetries} attempts: ${lastError?.message}`);
        console.warn(`  📄 Saving failed response for debugging...`);
        
        // Try to save the failed response for debugging
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const debugPath = `/tmp/concept_extraction_error_${timestamp}.txt`;
            fs.writeFileSync(debugPath, `Error: ${lastError?.message}\n\nResponse:\n${lastResponse || 'N/A'}`);
            console.warn(`  💾 Debug info saved to: ${debugPath}`);
        } catch (saveError) {
            // Ignore save errors
        }
        
        return {
            primary_concepts: [],
            categories: []
        };
    }
    
    // Fix control characters (newlines, tabs, etc.) within JSON string literals
    // Strip JSON-style comments (// ...) from the text
    // This is needed because some LLMs add comments to JSON responses
    private stripJSONComments(jsonText: string): string {
        const lines = jsonText.split('\n');
        const result: string[] = [];
        
        for (const line of lines) {
            // Check if line has a // comment
            const commentIndex = line.indexOf('//');
            if (commentIndex === -1) {
                // No comment, keep the line as-is
                result.push(line);
            } else {
                // We need to check if // is inside a string literal
                let inString = false;
                let escaped = false;
                let isCommentOutsideString = false;
                
                for (let i = 0; i < commentIndex; i++) {
                    const char = line[i];
                    
                    if (char === '"' && !escaped) {
                        inString = !inString;
                    }
                    
                    escaped = char === '\\' && !escaped;
                }
                
                // If we're not in a string at the comment position, it's a real comment
                if (!inString) {
                    isCommentOutsideString = true;
                }
                
                if (isCommentOutsideString) {
                    // Remove the comment, keeping content before it
                    const lineWithoutComment = line.substring(0, commentIndex).trimEnd();
                    // Only add non-empty lines
                    if (lineWithoutComment.length > 0) {
                        result.push(lineWithoutComment);
                    }
                } else {
                    // Comment is inside a string, keep the whole line
                    result.push(line);
                }
            }
        }
        
        return result.join('\n');
    }
    
    private fixControlCharactersInStrings(jsonText: string): string {
        let result = '';
        let inString = false;
        let escaped = false;
        
        for (let i = 0; i < jsonText.length; i++) {
            const char = jsonText[i];
            
            // Track if we're inside a string literal
            if (char === '"' && !escaped) {
                inString = !inString;
                result += char;
                escaped = false;
                continue;
            }
            
            // Track escape sequences
            if (char === '\\' && !escaped) {
                escaped = true;
                result += char;
                continue;
            }
            
            // If we're inside a string and encounter a control character
            if (inString && !escaped) {
                if (char === '\n' || char === '\r' || char === '\t') {
                    // Remove the newline and any following whitespace
                    // This handles cases like:
                    // "text with line\n  break" -> "text with line break"
                    while (i + 1 < jsonText.length && /\s/.test(jsonText[i + 1])) {
                        i++;
                    }
                    // Add a space only if the previous character wasn't whitespace
                    if (result.length > 0 && !/\s$/.test(result)) {
                        result += ' ';
                    }
                } else if (char.charCodeAt(0) < 32) {
                    // Other control characters - just skip them
                    continue;
                } else {
                    result += char;
                }
            } else {
                result += char;
            }
            
            escaped = false;
        }
        
        return result;
    }
    
    // Sanitize JSON to fix common issues
    private sanitizeJSON(jsonText: string): string {
        // Step 0a: Remove JSON comments (// style) which some LLMs add
        // This must be done before other processing to avoid breaking string detection
        jsonText = this.stripJSONComments(jsonText);
        
        // Step 0b: Fix control characters (newlines, tabs, etc.) within string literals
        // This handles cases where the LLM breaks long strings across multiple lines
        jsonText = this.fixControlCharactersInStrings(jsonText);
        
        // Step 1: Handle truncated JSON
        if (!jsonText.endsWith('}') && !jsonText.endsWith('}]')) {
            // Try to find the last complete array element
            const lastCompleteArray = jsonText.lastIndexOf('"]');
            if (lastCompleteArray > 0) {
                jsonText = jsonText.substring(0, lastCompleteArray + 2);
                
                // Close any open arrays
                const openBrackets = (jsonText.match(/\[/g) || []).length;
                const closeBrackets = (jsonText.match(/\]/g) || []).length;
                for (let i = 0; i < openBrackets - closeBrackets; i++) {
                    jsonText += ']';
                }
                jsonText += '\n}';
            }
        }
        
        // Step 2: Fix common escaping issues
        // This is a delicate operation - we need to escape quotes inside array strings
        // but not the quotes that are part of the JSON structure
        try {
            // First attempt: parse as-is
            JSON.parse(jsonText);
            return jsonText; // If it parses, return it unchanged
        } catch (e) {
            // Try to fix unescaped quotes in array values
            // This regex attempts to find and fix strings like: "text with "quotes" in it"
            // We'll replace them with: "text with \"quotes\" in it"
            
            // Match strings within arrays: "...", looking for unescaped quotes inside
            const fixedJson = jsonText.replace(
                /"([^"]*)"([^,\]\}])/g, 
                (match, p1, p2) => {
                    // If the character after the closing quote is not a comma, bracket, or brace,
                    // it's likely a malformed string
                    if (p2 && p2.trim() && !p2.match(/^[\s,\]\}]/)) {
                        return `"${p1}\\"${p2}`;
                    }
                    return match;
                }
            );
            
            // Additional fix: handle trailing commas in arrays
            const noTrailingCommas = fixedJson.replace(/,(\s*[\]\}])/g, '$1');
            
            return noTrailingCommas;
        }
    }
    
    // Advanced JSON recovery for malformed responses
    private recoverMalformedJSON(jsonText: string): string {
        // Strategy 1: Find the last complete concept object and truncate there
        // Look for pattern like: }, { or }, ] which indicates a complete object boundary
        
        // Find all complete concept objects (objects with "name" and "summary")
        const completeObjectPattern = /\{\s*"name"\s*:\s*"[^"]*"\s*,\s*"summary"\s*:\s*"[^"]*"\s*\}/g;
        let lastCompleteMatch: RegExpExecArray | null = null;
        let match;
        
        while ((match = completeObjectPattern.exec(jsonText)) !== null) {
            lastCompleteMatch = match;
        }
        
        if (lastCompleteMatch) {
            const endOfLastComplete = lastCompleteMatch.index + lastCompleteMatch[0].length;
            
            // Check if there's more content after that might be incomplete
            const remaining = jsonText.substring(endOfLastComplete);
            
            // If there's incomplete content, truncate to the last complete object
            if (remaining.includes('"name"') && !remaining.match(completeObjectPattern)) {
                console.warn('  🔧 Truncating to last complete concept object');
                let truncated = jsonText.substring(0, endOfLastComplete);
                
                // Close the structure properly
                const openBraces = (truncated.match(/\{/g) || []).length;
                const closeBraces = (truncated.match(/\}/g) || []).length;
                const openBrackets = (truncated.match(/\[/g) || []).length;
                const closeBrackets = (truncated.match(/\]/g) || []).length;
                
                // Close any open arrays first
                for (let i = 0; i < openBrackets - closeBrackets; i++) {
                    truncated += '\n  ]';
                }
                
                // Close any open objects
                for (let i = 0; i < openBraces - closeBraces; i++) {
                    truncated += '\n}';
                }
                
                return truncated;
            }
        }
        
        // Strategy 2: Fix missing commas between objects
        // Pattern: } { should be }, {
        let fixed = jsonText.replace(/\}\s*\{/g, '}, {');
        
        // Strategy 3: Fix missing commas after string values followed by "name"
        // Pattern: "value" "name" should be "value", "name"
        fixed = fixed.replace(/"(\s*)"name"/g, '",\n    "name"');
        
        // Strategy 4: Remove any trailing incomplete object
        // Find the last complete } and check if there's an incomplete { after
        const lastCloseBrace = fixed.lastIndexOf('}');
        const lastOpenBrace = fixed.lastIndexOf('{');
        
        if (lastOpenBrace > lastCloseBrace) {
            // There's an unclosed object - find the start of this incomplete object
            const beforeIncomplete = fixed.lastIndexOf(',', lastOpenBrace);
            if (beforeIncomplete > 0) {
                console.warn('  🔧 Removing incomplete trailing object');
                fixed = fixed.substring(0, beforeIncomplete);
                
                // Close any remaining open brackets/braces
                const openBrackets = (fixed.match(/\[/g) || []).length;
                const closeBrackets = (fixed.match(/\]/g) || []).length;
                const openBraces = (fixed.match(/\{/g) || []).length;
                const closeBraces = (fixed.match(/\}/g) || []).length;
                
                for (let i = 0; i < openBrackets - closeBrackets; i++) {
                    fixed += '\n  ]';
                }
                for (let i = 0; i < openBraces - closeBraces; i++) {
                    fixed += '\n}';
                }
            }
        }
        
        return fixed;
    }
    
    // Merge multiple concept extractions into one
    private mergeConceptExtractions(extractions: ConceptMetadata[]): ConceptMetadata {
        // Map to store concepts with their best summary (first one found)
        const conceptMap = new Map<string, ExtractedConcept>();
        const mergedCategories = new Set<string>();
        
        for (const extraction of extractions) {
            extraction.primary_concepts.forEach(c => {
                if (typeof c === 'string' && c.trim()) {
                    // Legacy format: string only
                    const key = c.toLowerCase().trim();
                    if (!conceptMap.has(key)) {
                        conceptMap.set(key, { name: key, summary: '' });
                    }
                } else if (typeof c === 'object' && c.name) {
                    // New format: object with name and summary
                    const key = c.name.toLowerCase().trim();
                    if (!conceptMap.has(key)) {
                        // First occurrence - use this summary
                        conceptMap.set(key, { 
                            name: key, 
                            summary: c.summary || '' 
                        });
                    } else if (!conceptMap.get(key)!.summary && c.summary) {
                        // Existing entry has no summary, use this one
                        conceptMap.get(key)!.summary = c.summary;
                    }
                }
            });
            extraction.categories.forEach(c => {
                if (typeof c === 'string' && c.trim()) {
                    mergedCategories.add(c);
                }
            });
        }
        
        console.log(`  ✅ Merged: ${conceptMap.size} unique concepts from ${extractions.length} chunks`);
        
        return {
            primary_concepts: Array.from(conceptMap.values()),
            categories: Array.from(mergedCategories).slice(0, 7)
        };
    }
    
    // Single-pass extraction for regular documents
    private async extractConceptsSinglePass(contentSample: string): Promise<ConceptMetadata> {
        // Calculate appropriate max_tokens based on input size
        // GPT-5 Mini has 400k context total (input + output must fit)
        const estimatedInputTokens = Math.ceil(contentSample.length / 4) + 2000; // ~4 chars per token + prompt overhead
        const contextLimit = 400000; // 400k tokens total
        const dynamicMaxTokens = Math.min(
            contextLimit - estimatedInputTokens - 10000, // Reserve buffer
            16000  // Conservative output limit
        );
        
        // Build prompt from template file
        const prompt = buildConceptExtractionPrompt(contentSample);
        
        try {
            const response = await this.callOpenRouter(prompt, dynamicMaxTokens);
            
            
            // Try to parse JSON, handling markdown code blocks
            let jsonText = response.trim();
            
            // Remove markdown code blocks if present
            if (jsonText.includes('```')) {
                // Extract JSON from markdown code blocks
                const jsonMatch = jsonText.match(/```json?\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    jsonText = jsonMatch[1].trim();
                } else {
                    // Fallback: remove all ``` markers
                    jsonText = jsonText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
                }
            }
            
            // Apply full JSON sanitization (control characters, comments, truncation recovery)
            jsonText = this.sanitizeJSON(jsonText);
            
            // Validate JSON ends properly (light check only)
            if (!jsonText.endsWith('}') && !jsonText.endsWith('"}')) {
                console.warn('  ⚠️  Attempting to recover truncated JSON...');
                
                // Find the last complete array or string field
                let recovered = false;
                let closedJson = jsonText;
                
                // Try to close incomplete array item
                const lastQuote = jsonText.lastIndexOf('"');
                const lastComma = jsonText.lastIndexOf(',');
                const lastArrayClose = jsonText.lastIndexOf(']');
                
                if (lastQuote > lastArrayClose && lastQuote > lastComma) {
                    // We're in the middle of a string, close it
                    closedJson = jsonText.substring(0, lastComma > lastArrayClose ? lastComma : lastQuote + 1);
                }
                
                // Find last complete field and close arrays/object
                const lastCompleteArray = closedJson.lastIndexOf('"]');
                const lastCompleteSummary = closedJson.lastIndexOf('"summary":');
                
                if (lastCompleteArray > 0 || lastCompleteSummary > 0) {
                    const cutPoint = Math.max(lastCompleteArray + 2, lastCompleteSummary > 0 ? closedJson.indexOf('\n', lastCompleteSummary) : 0);
                    if (cutPoint > 0) {
                        closedJson = closedJson.substring(0, cutPoint);
                        // Close any open arrays
                        const openBrackets = (closedJson.match(/\[/g) || []).length;
                        const closeBrackets = (closedJson.match(/\]/g) || []).length;
                        for (let i = 0; i < openBrackets - closeBrackets; i++) {
                            closedJson += '\n  ]';
                        }
                        closedJson += '\n}';
                        jsonText = closedJson;
                        recovered = true;
                    }
                }
                
                if (!recovered) {
                    throw new Error('JSON response truncated and unrecoverable');
                }
            }
            
            // Attempt advanced JSON recovery if standard parse fails
            let rawConcepts;
            try {
                rawConcepts = JSON.parse(jsonText);
            } catch (parseError) {
                // Try to recover by finding valid JSON structure
                console.warn('  ⚠️  JSON parse failed, attempting advanced recovery...');
                jsonText = this.recoverMalformedJSON(jsonText);
                rawConcepts = JSON.parse(jsonText);
            }
            
            // Parse primary_concepts - handle both new (object[]) and legacy (string[]) formats
            let primaryConcepts: (ExtractedConcept | string)[] = [];
            if (Array.isArray(rawConcepts.primary_concepts)) {
                primaryConcepts = rawConcepts.primary_concepts
                    .filter((c: any) => c != null)
                    .map((c: any) => {
                        if (typeof c === 'string') {
                            // Legacy format: string only
                            return c.trim() ? c : null;
                        } else if (typeof c === 'object' && c.name) {
                            // New format: object with name and summary
                            return {
                                name: String(c.name).trim(),
                                summary: String(c.summary || '').trim()
                            } as ExtractedConcept;
                        }
                        return null;
                    })
                    .filter((c: any) => c != null);
            }
            
            // Ensure categories exist
            const categories = Array.isArray(rawConcepts.categories) 
                ? rawConcepts.categories.filter((c: any) => typeof c === 'string' && c.trim())
                : ['General'];
            
            return {
                primary_concepts: primaryConcepts,
                categories
            } as ConceptMetadata;
        } catch (error) {
            // Properly serialize error for logging
            const errorMessage = error instanceof Error 
                ? `${error.name}: ${error.message}` 
                : (typeof error === 'object' ? JSON.stringify(error) : String(error));
            console.error(`Concept extraction error: ${errorMessage}`);
            
            // Save debug info for analysis
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const debugPath = `/tmp/concept_extraction_error_${timestamp}.txt`;
                const debugContent = `Error: ${errorMessage}\n\nStack: ${error instanceof Error ? error.stack : 'N/A'}`;
                fs.writeFileSync(debugPath, debugContent);
                console.warn(`  💾 Debug info saved to: ${debugPath}`);
            } catch (saveError) {
                // Ignore save errors
            }
            
            // Return empty structure as fallback
            return {
                primary_concepts: [],
                categories: ['General']
            };
        }
    }
    
    private sampleContent(docs: Document[]): string {
        // Process ENTIRE document - no sampling
        // Models have large context windows and can handle full books
        const allContent = docs.map(d => d.pageContent).join('\n\n');
        
        
            return allContent;
        }
    
    private async callOpenRouter(prompt: string, maxTokens: number): Promise<string> {
        // Rate limit requests to avoid API throttling
        await this.rateLimitDelay();
        
        // Use resilient executor if available (provides retry, circuit breaker, timeout, bulkhead)
        if (this.resilientExecutor) {
            return this.resilientExecutor.execute(
                () => this.performAPICall(prompt, maxTokens),
                {
                    ...ResilienceProfiles.LLM_API,
                    name: 'llm_concept_extraction'
                }
            );
        }
        
        // Fallback: direct call without resilience (backward compatible)
        return this.performAPICall(prompt, maxTokens);
    }
    
    /**
     * Performs the actual LLM API call (can be wrapped with resilience).
     * @private
     */
    private async performAPICall(prompt: string, maxTokens: number): Promise<string> {
            const requestBody = {
                model: 'openai/gpt-5-mini',  // 400k context, excellent instruction-following, $0.25/M in, $2/M out
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,  // Higher temp for more creative/comprehensive extraction
                max_tokens: maxTokens  // Dynamically calculated based on input size
            };
            
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/m2ux/lance-mcp',
                'X-Title': 'LanceDB MCP Concept Extraction'
            },
                body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
                const errorText = await response.text();
                console.error(`  ❌ LLM API error: ${response.status} ${response.statusText}`);
                console.error(`  Response: ${errorText.substring(0, 500)}`);
            throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
        }
        
        // Parse response
                const responseText = await response.text();
                
                // Check for empty response
        if (responseText.trim().length === 0) {
                    console.error(`  ❌ Response is empty or only whitespace!`);
                    throw new Error('API returned empty response');
                }
                
        const data = JSON.parse(responseText);
        
        if (!data.choices || data.choices.length === 0) {
                console.error('  ❌ No choices in API response:', JSON.stringify(data).substring(0, 500));
            throw new Error('No response from LLM API');
        }
        
            const content = data.choices[0].message.content;
            
        // Check if content is meaningful
            if (!content || content.trim().length < 100) {
                console.error(`  ❌ Empty response from API (length: ${content?.length || 0})`);
            throw new Error('API returned empty or whitespace-only content');
            }
            
            return content;
    }
}


