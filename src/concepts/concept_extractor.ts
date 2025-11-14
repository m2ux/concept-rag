import { Document } from "@langchain/core/documents";
import { ConceptMetadata } from "./types.js";
import { buildConceptExtractionPrompt } from "../config.js";
import * as fs from "fs";

export class ConceptExtractor {
    
    private openRouterApiKey: string;
    private lastRequestTime: number = 0;
    private minRequestInterval: number = 3000; // 3 seconds between requests
    
    constructor(apiKey: string) {
        this.openRouterApiKey = apiKey;
    }
    
    private async rateLimitDelay(): Promise<void> {
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
                const { limit_remaining, usage_daily } = data.data;
                
                console.log(`💳 API Status:`);
                if (limit_remaining !== null) {
                    console.log(`   Credits: ${limit_remaining}`);
                } else {
                    console.log(`   Credits: Unlimited`);
                }
                console.log(`   Usage today: $${usage_daily || 0}`);
                
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
            console.log(`  📚 Large document (${estimatedTokens.toLocaleString()} tokens) - splitting into chunks...`);
            return await this.extractConceptsMultiPass(fullContent, tokenLimit);
        }
        
        // Regular extraction for smaller documents
        return await this.extractConceptsSinglePass(fullContent);
    }
    
    // Multi-pass extraction for large documents
    private async extractConceptsMultiPass(content: string, tokenLimit: number): Promise<ConceptMetadata> {
        const charsPerToken = 4;
        const charLimit = tokenLimit * charsPerToken; // ~400k chars per chunk
        
        const chunks: string[] = [];
        for (let i = 0; i < content.length; i += charLimit) {
            chunks.push(content.slice(i, i + charLimit));
        }
        
        console.log(`  📄 Split into ${chunks.length} chunks for processing`);
        
        const allExtractions: ConceptMetadata[] = [];
        
        // Extract concepts from each chunk
        for (let i = 0; i < chunks.length; i++) {
            console.log(`  🔄 Processing chunk ${i + 1}/${chunks.length}...`);
            const extracted = await this.extractConceptsFromChunk(chunks[i]);
            allExtractions.push(extracted);
        }
        
        // Merge all extractions
        return this.mergeConceptExtractions(allExtractions);
    }
    
    // Extract concepts from a chunk
    private async extractConceptsFromChunk(chunk: string): Promise<ConceptMetadata> {
        const estimatedTokens = Math.ceil(chunk.length / 4) + 1000;
        const contextLimit = 400000; // gpt-5-mini has 400k context
        const safetyBuffer = 10000;
        const calculatedMaxTokens = contextLimit - estimatedTokens - safetyBuffer;
        const maxTokens = Math.max(Math.min(calculatedMaxTokens, 65536), 16); // Ensure >= 16
        
        // Build prompt from template file
        const prompt = buildConceptExtractionPrompt(chunk);
        
        let response: string | undefined;
        try {
            response = await this.callOpenRouter(prompt, maxTokens);
            
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
            
            // Ensure arrays and filter out non-strings
            return {
                primary_concepts: Array.isArray(concepts.primary_concepts) 
                    ? concepts.primary_concepts.filter((c: any) => typeof c === 'string' && c.trim()) 
                    : [],
                categories: Array.isArray(concepts.categories) 
                    ? concepts.categories.filter((c: any) => typeof c === 'string' && c.trim()) 
                    : [],
                related_concepts: Array.isArray(concepts.related_concepts) 
                    ? concepts.related_concepts.filter((c: any) => typeof c === 'string' && c.trim()) 
                    : []
            };
        } catch (error: any) {
            console.warn(`  ⚠️  Chunk extraction failed: ${error.message}`);
            console.warn(`  📄 Saving failed response for debugging...`);
            
            // Try to save the failed response for debugging
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const debugPath = `/tmp/concept_extraction_error_${timestamp}.txt`;
                fs.writeFileSync(debugPath, `Error: ${error.message}\n\nResponse:\n${response || 'N/A'}`);
                console.warn(`  💾 Debug info saved to: ${debugPath}`);
            } catch (saveError) {
                // Ignore save errors
            }
            
            return {
                primary_concepts: [],
                categories: [],
                related_concepts: []
            };
        }
    }
    
    // Sanitize JSON to fix common issues
    private sanitizeJSON(jsonText: string): string {
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
    
    // Merge multiple concept extractions into one
    private mergeConceptExtractions(extractions: ConceptMetadata[]): ConceptMetadata {
        const mergedConcepts = new Set<string>();
        const mergedCategories = new Set<string>();
        const mergedRelated = new Set<string>();
        
        for (const extraction of extractions) {
            // Type guard to ensure we only process strings
            extraction.primary_concepts.forEach(c => {
                if (typeof c === 'string' && c.trim()) {
                    mergedConcepts.add(c.toLowerCase());
                }
            });
            extraction.categories.forEach(c => {
                if (typeof c === 'string' && c.trim()) {
                    mergedCategories.add(c);
                }
            });
            extraction.related_concepts.forEach(c => {
                if (typeof c === 'string' && c.trim()) {
                    mergedRelated.add(c.toLowerCase());
                }
            });
        }
        
        console.log(`  ✅ Merged: ${mergedConcepts.size} unique concepts from ${extractions.length} chunks`);
        
        return {
            primary_concepts: Array.from(mergedConcepts),
            categories: Array.from(mergedCategories).slice(0, 7),
            related_concepts: Array.from(mergedRelated).slice(0, 50)
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
            
            const concepts = JSON.parse(jsonText);
            
            
            // Ensure all fields exist
            if (!concepts.primary_concepts) {
                concepts.primary_concepts = [];
            }
            if (!concepts.categories) {
                concepts.categories = ['General'];
            }
            if (!concepts.related_concepts) {
                concepts.related_concepts = [];
            }
            
            
            return concepts as ConceptMetadata;
        } catch (error) {
            console.error('Concept extraction error:', error);
            // Return empty structure as fallback
            return {
                primary_concepts: [],
                categories: ['General'],
                related_concepts: []
            };
        }
    }
    
    private sampleContent(docs: Document[]): string {
        // Process ENTIRE document - no sampling
        // Models have large context windows and can handle full books
        const allContent = docs.map(d => d.pageContent).join('\n\n');
        
        
            return allContent;
        }
    
    private async callOpenRouter(prompt: string, maxTokens: number, retryCount = 0): Promise<string> {
        const maxRetries = 3;
        
        // Rate limit requests to avoid API throttling
        await this.rateLimitDelay();
        
        try {
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
                
                // Handle rate limiting specifically
                if (response.status === 429) {
                    console.warn(`  🚦 Rate limited! Waiting 10 seconds before retry...`);
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        return this.callOpenRouter(prompt, maxTokens, retryCount + 1);
                    }
                }
                
            throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
        }
        
            // Try to parse response, handle large responses carefully
            let data;
            try {
                const responseText = await response.text();
                
                // Check for empty response
                const trimmedResponse = responseText.trim();
                if (trimmedResponse.length === 0) {
                    console.error(`  ❌ Response is empty or only whitespace!`);
                    throw new Error('API returned empty response');
                }
                
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error(`  ❌ Failed to parse API response JSON`);
                if (retryCount < maxRetries) {
                    const waitTime = 5000 * (retryCount + 1); // 5s, 10s, 15s
                    console.warn(`  🔄 Retrying (${retryCount + 1}/${maxRetries}) after ${waitTime/1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return this.callOpenRouter(prompt, maxTokens, retryCount + 1);
                }
                throw parseError;
            }
        
        if (!data.choices || data.choices.length === 0) {
                console.error('  ❌ No choices in API response:', JSON.stringify(data).substring(0, 500));
            throw new Error('No response from LLM API');
        }
        
            const content = data.choices[0].message.content;
            
            // Check if content is mostly whitespace
            if (!content || content.trim().length < 100) {
                console.error(`  ❌ Empty response from API (length: ${content?.length || 0})`);
                
                // Retry with exponential backoff
                if (retryCount < maxRetries) {
                    const waitTime = 5000 * (retryCount + 1); // 5s, 10s, 15s
                    console.warn(`  🔄 Retrying empty response (${retryCount + 1}/${maxRetries}) after ${waitTime/1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return this.callOpenRouter(prompt, maxTokens, retryCount + 1);
                }
                
                throw new Error('API returned empty or whitespace-only content after retries');
            }
            
            return content;
        } catch (error) {
            console.error('  ❌ LLM API call failed:', error);
            throw error;
        }
    }
}


