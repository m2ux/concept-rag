import { Document } from "@langchain/core/documents";
import { ConceptMetadata } from "./types.js";

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
                const { limit_remaining, usage_daily, is_free_tier } = data.data;
                
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
        const contextLimit = 1048576;
        const maxTokens = Math.min(contextLimit - estimatedTokens - 10000, 65536);
        
        const prompt = `Extract concepts from this text as JSON:

${chunk}

Return JSON:
{
  "primary_concepts": ["80-150 concepts, methods, ideas"],
  "categories": ["3-7 domains"],
  "related_concepts": ["20-40 related topics"]
}

EXCLUDE:
❌ Temporal descriptions (e.g., "periods of heavy recruitment")
❌ Specific action phrases (e.g., "balancing cohesion with innovation")
❌ Suppositions (e.g., "attraction for collaborators")
❌ Generic single words (e.g., "power", "riches", "time", "people")
❌ Names, dates, metadata

INCLUDE:
✅ Domain terms (e.g., "speciation", "exaptive bootstrapping")
✅ Theories, methodologies, processes, phenomena
✅ Multi-word concepts

Use lowercase. Output only JSON.`;
        
        try {
            const response = await this.callOpenRouter(prompt, maxTokens);
            
            
            // Parse response
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
            
            const concepts = JSON.parse(jsonText);
            
            return {
                primary_concepts: concepts.primary_concepts || [],
                categories: concepts.categories || [],
                related_concepts: concepts.related_concepts || []
            };
        } catch (error) {
            console.warn(`  ⚠️  Chunk extraction failed: ${error.message}`);
            return {
                primary_concepts: [],
                categories: [],
                related_concepts: []
            };
        }
    }
    
    // Merge multiple concept extractions into one
    private mergeConceptExtractions(extractions: ConceptMetadata[]): ConceptMetadata {
        const mergedConcepts = new Set<string>();
        const mergedCategories = new Set<string>();
        const mergedRelated = new Set<string>();
        
        for (const extraction of extractions) {
            extraction.primary_concepts.forEach(c => mergedConcepts.add(c.toLowerCase()));
            extraction.categories.forEach(c => mergedCategories.add(c));
            extraction.related_concepts.forEach(c => mergedRelated.add(c.toLowerCase()));
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
        
        const prompt = `Extract ALL significant concepts from this document as JSON.

${contentSample}

Return JSON with these 3 fields:
1. primary_concepts: Array of 80-150 strings (concepts, methods, ideas, processes from the document)
2. categories: Array of 3-7 strings (broad domain names)
3. related_concepts: Array of 20-40 strings (related research topics)

IMPORTANT - Extract ONLY reusable concepts, theories, and domain knowledge. DO NOT extract:
❌ Temporal/situational descriptions (e.g., "periods of heavy recruitment", "times of crisis", "early adoption phase")
❌ Overly specific action phrases (e.g., "balancing broad cohesion with innovation", "managing diverse stakeholders")
❌ Suppositions or observations (e.g., "attraction for potential collaborators", "tendency toward cooperation")
❌ Generic common single words (e.g., "power", "riches", "time", "space", "people", "work", "money")
❌ Names of people, organizations, places, publications
❌ Dates, page numbers, metadata

✅ DO extract:
- Core theories (e.g., "complexity theory", "game theory", "field theory")
- Methodologies (e.g., "agent-based modeling", "regression analysis", "ethnography")
- Domain-specific technical terms (e.g., "speciation", "exaptive bootstrapping", "allometric scaling")
- Multi-word conceptual phrases (e.g., "strategic thinking", "social change", "network formation")
- Processes and phenomena (e.g., "urban scaling", "emergence", "path dependence")

Use lowercase. Output complete JSON with ALL fields fully populated:`;
        
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
                const lastBracket = jsonText.lastIndexOf('[');
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
                console.error(`  ❌ OpenRouter API error: ${response.status} ${response.statusText}`);
                console.error(`  Response: ${errorText.substring(0, 500)}`);
                
                // Handle rate limiting specifically
                if (response.status === 429) {
                    console.warn(`  🚦 Rate limited! Waiting 10 seconds before retry...`);
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        return this.callOpenRouter(prompt, retryCount + 1);
                    }
                }
                
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
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
                    return this.callOpenRouter(prompt, retryCount + 1);
                }
                throw parseError;
            }
        
        if (!data.choices || data.choices.length === 0) {
                console.error('  ❌ No choices in API response:', JSON.stringify(data).substring(0, 500));
            throw new Error('No response from OpenRouter API');
        }
        
            const content = data.choices[0].message.content;
            
            // Check if content is mostly whitespace
            if (content.trim().length < 100) {
                console.error(`  ❌ Empty response from API`);
                throw new Error('API returned empty or whitespace-only content');
            }
            
            return content;
        } catch (error) {
            console.error('  ❌ OpenRouter API call failed:', error);
            throw error;
        }
    }
}


