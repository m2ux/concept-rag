/**
 * Summary generation for documents, concepts and categories using LLM
 */

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "x-ai/grok-4.6";
const DEFAULT_BATCH_SIZE = 30;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

/** Maximum characters of document text sent to the LLM for an overview */
export const OVERVIEW_INPUT_LIMIT = 8000;

export interface SummaryResult {
  name: string;
  summary: string;
}

/**
 * Generate ASCII progress bar for summary generation
 */
function summaryProgressBar(
  current: number, 
  total: number, 
  type: 'concept' | 'category',
  width: number = 30
): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const emoji = type === 'concept' ? '🧠' : '📂';
  const label = type === 'concept' ? 'Concepts' : 'Categories';
  const progress = `${emoji} ${label}: [${bar}] ${percentage}% (${current}/${total})`;
  
  // Pad with spaces to ensure complete line overwrite
  return progress.padEnd(80, ' ');
}

let lastRequestTime = 0;

async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delayNeeded = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  lastRequestTime = Date.now();
}

/**
 * Generate a one-sentence content overview for a single document.
 *
 * This is the document-level summary stored in `catalog.summary` (ahead of the
 * "Key Concepts"/"Categories" enrichment lines). Used by both the seeding
 * pipeline and the `--populate-summaries` backfill so the wording stays
 * identical across both paths.
 *
 * @param text - Document text (only the first {@link OVERVIEW_INPUT_LIMIT} chars are sent)
 * @param options.apiKey - OpenRouter API key (defaults to OPENROUTER_API_KEY)
 * @param options.model - Model override (defaults to this module's DEFAULT_MODEL)
 * @param options.rateLimit - Space requests at least 1s apart (default: false).
 *                            Seeding runs overviews across parallel workers, so it
 *                            opts out; the backfill opts in.
 * @throws If the API key is missing or the API returns a non-OK response
 */
export async function generateDocumentOverview(
  text: string,
  options: {
    apiKey?: string;
    model?: string;
    rateLimit?: boolean;
  } = {}
): Promise<string> {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not set');
  }

  if (options.rateLimit) {
    await rateLimitDelay();
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/adiom-data/lance-mcp',
      'X-Title': 'Lance MCP Server'
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages: [{
        role: 'user',
        content: `Write a high-level one sentence content overview based on the text below. WRITE THE CONTENT OVERVIEW ONLY:\n\n${text.slice(0, OVERVIEW_INPUT_LIMIT)}`
      }],
      max_tokens: 100,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Generate summaries for a batch of items
 */
async function generateSummaryBatch(
  items: string[],
  type: 'concept' | 'category',
  apiKey: string,
  model: string = DEFAULT_MODEL
): Promise<SummaryResult[]> {
  await rateLimitDelay();
  
  const prompt = type === 'concept' 
    ? `Generate a one-sentence summary for each of the following concepts. The summary should be a clear, concise definition that would help someone understand what the concept means.

Format your response as JSON array:
[{"name": "concept name", "summary": "one sentence summary"}]

Concepts to summarize:
${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Return ONLY the JSON array, no other text.`
    : `Generate a one-sentence summary for each of the following categories/domains. The summary should describe what topics and subjects fall under this category.

Format your response as JSON array:
[{"name": "category name", "summary": "one sentence summary"}]

Categories to summarize:
${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Return ONLY the JSON array, no other text.`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/concept-rag',
        'X-Title': 'Concept-RAG Summary Generation'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('  ⚠️  Failed to parse JSON from response');
      return [];
    }
    
    const results: SummaryResult[] = JSON.parse(jsonMatch[0]);
    return results;
  } catch (error) {
    console.error('  ❌ Error generating summaries:', error);
    return [];
  }
}

/**
 * Generate summaries for a list of items
 * @returns Map of item name (lowercase) to summary
 */
export async function generateSummaries(
  items: string[],
  type: 'concept' | 'category',
  options: {
    apiKey?: string;
    model?: string;
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<Map<string, string>> {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  OPENROUTER_API_KEY not set, skipping summary generation');
    return new Map();
  }

  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
  const model = options.model || DEFAULT_MODEL;
  const summaryMap = new Map<string, string>();
  
  const totalBatches = Math.ceil(items.length / batchSize);
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    if (options.onProgress) {
      options.onProgress(i, items.length);
    }
    
    const results = await generateSummaryBatch(batch, type, apiKey, model);
    
    // Match results back to items
    for (const result of results) {
      if (result.name && result.summary) {
        summaryMap.set(result.name.toLowerCase(), result.summary);
      }
    }
    
    // Log progress if no custom handler
    if (!options.onProgress && items.length > batchSize) {
      process.stdout.write(`\r  Processing ${type}s: batch ${batchNum}/${totalBatches}...`);
    }
  }
  
  if (!options.onProgress && items.length > batchSize) {
    console.log(` Done (${summaryMap.size} summaries)`);
  }
  
  return summaryMap;
}

/**
 * Generate summaries for category records during seeding
 */
export async function generateCategorySummaries(
  categories: string[],
  options: {
    apiKey?: string;
    model?: string;
    batchSize?: number;
  } = {}
): Promise<Map<string, string>> {
  if (categories.length === 0) {
    return new Map();
  }
  
  console.log(`  📝 Generating summaries for ${categories.length} categories...`);
  
  const summaries = await generateSummaries(categories, 'category', {
    ...options,
    onProgress: (completed, total) => {
      process.stdout.write(`\r  ${summaryProgressBar(completed, total, 'category')}`);
    }
  });
  
  // Clear progress bar and show completion
  process.stdout.write('\r' + ' '.repeat(80) + '\r');
  console.log(`  ✅ Generated ${summaries.size} category summaries`);
  return summaries;
}

/**
 * Generate summaries for concept records during seeding
 */
export async function generateConceptSummaries(
  concepts: string[],
  options: {
    apiKey?: string;
    model?: string;
    batchSize?: number;
  } = {}
): Promise<Map<string, string>> {
  if (concepts.length === 0) {
    return new Map();
  }
  
  console.log(`  📝 Generating summaries for ${concepts.length} concepts...`);
  
  const summaries = await generateSummaries(concepts, 'concept', {
    ...options,
    onProgress: (completed, total) => {
      process.stdout.write(`\r  ${summaryProgressBar(completed, total, 'concept')}`);
    }
  });
  
  // Clear progress bar and show completion
  process.stdout.write('\r' + ' '.repeat(80) + '\r');
  console.log(`  ✅ Generated ${summaries.size} concept summaries`);
  return summaries;
}

