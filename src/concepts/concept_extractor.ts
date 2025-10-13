import { Document } from "@langchain/core/documents";
import { ConceptMetadata } from "./types.js";

export class ConceptExtractor {
    
    private openRouterApiKey: string;
    
    constructor(apiKey: string) {
        this.openRouterApiKey = apiKey;
    }
    
    // Extract concepts from document using LLM
    async extractConcepts(docs: Document[]): Promise<ConceptMetadata> {
        const contentSample = this.sampleContent(docs);
        
        const prompt = `You are an exhaustive document analyzer. Extract EVERY significant concept from this document for semantic search. Be extremely thorough - this is for building a comprehensive search index.

Document Content:
${contentSample}

Return a JSON object with:
1. "primary_concepts": [MINIMUM 40, TARGET 60+ high-level topics/themes - extract EVERYTHING discussed, no matter how briefly]
2. "technical_terms": [MINIMUM 60, TARGET 100+ specific terms, methodologies, theories, names, or specialized vocabulary - list EVERY significant term you encounter]
3. "categories": [3-7 broad domains/fields this document relates to]
4. "related_concepts": [MINIMUM 20, TARGET 30+ topics someone researching this would also explore]
5. "summary": "2-3 sentence overview"

TARGET: 120-200+ TOTAL ITEMS across all categories

CRITICAL - Be EXHAUSTIVE, not selective:
- Extract EVERY concept, no matter how minor
- Include ALL proper names (authors, theories, movements, people, places)
- Include ALL methodologies, frameworks, and systems mentioned
- Include ALL philosophical, theoretical, and practical concepts
- Include ALL domain-specific terminology and jargon
- Include variations and related forms (e.g., "strategy", "strategic", "strategist")
- If the document has 100+ concepts, extract all 100+
- Better to over-extract than miss anything

Example output for a philosophy/strategy book (showing EXHAUSTIVE extraction):
{
  "primary_concepts": ["military strategy", "tactical planning", "strategic thinking", "competitive advantage", "deception tactics", "terrain analysis", "leadership principles", "force deployment", "situational awareness", "adaptive strategy", "resource management", "psychological warfare", "timing and opportunity", "intelligence gathering", "organizational structure", "battlefield dynamics", "strategic positioning", "defensive strategy", "offensive operations", "alliance building", "enemy assessment", "morale management", "supply chain logistics", "communication systems", "command hierarchy", "tactical flexibility", "strategic patience", "environmental factors", "risk assessment", "contingency planning", "victory conditions", "defeat prevention", "force composition", "training methodologies", "historical analysis", "comparative strategy", "ethical considerations", "political context", "economic factors", "technological advantages"],
  "technical_terms": ["flanking maneuver", "strategic positioning", "tactical retreat", "force multiplier", "center of gravity", "lines of communication", "fog of war", "strategic depth", "operational tempo", "asymmetric warfare", "attrition strategy", "maneuver warfare", "strategic surprise", "defensive perimeter", "offensive momentum", "calculated risk", "strategic initiative", "tactical flexibility", "organizational culture", "command structure", "battlefield geometry", "strategic deception", "operational security", "force concentration", "strategic patience", "pincer movement", "feint", "envelopment", "breakthrough", "encirclement", "retreat", "advance", "reconnaissance", "surveillance", "intelligence", "counterintelligence", "propaganda", "morale", "discipline", "training", "drill", "logistics", "supply lines", "reinforcements", "reserves", "vanguard", "rearguard", "scouts", "messengers", "signals", "fortifications", "siegecraft", "ambush", "raid", "skirmish", "engagement", "battle", "campaign", "war", "peace", "treaty", "alliance", "coalition", "terrain", "weather", "season", "climate", "geography", "topography", "mountains", "rivers", "plains", "forests", "cities", "fortresses", "roads", "passes", "bridges", "weapons", "armor", "cavalry", "infantry", "archers", "artillery", "navy", "militia", "mercenaries", "generals", "officers", "soldiers", "spies", "diplomats"],
  "categories": ["Military Strategy", "Philosophy", "Leadership", "Organizational Theory", "Decision Making", "History", "Political Science"],
  "related_concepts": ["game theory", "organizational behavior", "competitive strategy", "strategic management", "decision theory", "risk management", "systems thinking", "complexity theory", "negotiation tactics", "conflict resolution", "power dynamics", "strategic communication", "resource allocation", "game theory", "prisoner's dilemma", "zero-sum games", "coalition formation", "strategic alliances", "competitive intelligence", "scenario planning", "strategic foresight", "operational excellence"],
  "summary": "This document covers military strategy and tactical principles applicable to competitive situations, emphasizing adaptability, strategic thinking, and understanding of environmental factors in achieving objectives."
}

MANDATORY REQUIREMENTS:
- Use lowercase for concepts and terms
- MINIMUM 120 total items, TARGET 200+ across all categories
- If you extract fewer than 100 items, you have failed - go back and extract more
- Include EVERY name, theory, methodology, framework, person, place, event, concept
- Extract EVERYTHING - even tangentially related concepts
- Break down compound concepts into individual terms
- Include synonyms and variations (e.g., "strategy", "strategic planning", "strategic thinking")
- Extract from the ENTIRE sample provided (beginning, middle, end)
- When in doubt, ALWAYS include it - over-extraction is desired

Return ONLY the JSON object, no markdown formatting or explanation.`;
        
        try {
            const response = await this.callOpenRouter(prompt);
            
            // Try to parse JSON, handling markdown code blocks if present
            let jsonText = response.trim();
            
            // Remove markdown code blocks if present
            if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            }
            
            const concepts = JSON.parse(jsonText);
            
            // Validate structure
            if (!concepts.primary_concepts || !concepts.technical_terms || !concepts.categories) {
                throw new Error('Invalid concept structure returned from LLM');
            }
            
            return concepts as ConceptMetadata;
        } catch (error) {
            console.error('Concept extraction error:', error);
            // Return empty structure as fallback
            return {
                primary_concepts: [],
                technical_terms: [],
                categories: ['General'],
                related_concepts: [],
                summary: 'Concept extraction failed for this document.'
            };
        }
    }
    
    private sampleContent(docs: Document[]): string {
        // Take more content from beginning, middle, and end for exhaustive coverage
        const allContent = docs.map(d => d.pageContent).join('\n\n');
        const totalLength = allContent.length;
        
        if (totalLength <= 10000) {
            // Small/medium document, use all of it
            return allContent;
        }
        
        // Large document: sample more extensively - beginning (4000), middle (3000), end (2000)
        const beginning = allContent.slice(0, 4000);
        const middleStart = Math.floor(totalLength / 2) - 1500;
        const middle = allContent.slice(middleStart, middleStart + 3000);
        const end = allContent.slice(-2000);
        
        return `${beginning}\n\n[... middle section ...]\n\n${middle}\n\n[... end section ...]\n\n${end}`;
    }
    
    private async callOpenRouter(prompt: string): Promise<string> {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/m2ux/lance-mcp',
                'X-Title': 'LanceDB MCP Concept Extraction'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4.5',  // Latest Sonnet (Sep 2025) - best for comprehensive concept extraction
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.2,  // Very low temperature for thorough, systematic extraction
                max_tokens: 4000  // Increased for exhaustive concept extraction (120-200+ concepts)
            })
        });
        
        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from OpenRouter API');
        }
        
        return data.choices[0].message.content;
    }
}


