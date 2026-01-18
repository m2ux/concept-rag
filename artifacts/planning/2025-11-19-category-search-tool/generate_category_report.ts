import { ApplicationContainer } from '../../../src/application/container.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

async function main() {
  try {
    const homeDir = os.homedir();
    const dbUrl = path.join(homeDir, '.concept_rag');
    
    console.log(`Connecting to database at ${dbUrl}...`);
    
    const container = new ApplicationContainer();
    await container.initialize(dbUrl);
    
    const tool = container.getTool('category_search');
    const category = 'software engineering';
    
    console.log(`Searching for category: "${category}"...`);
    
    // Set a high limit to get "all" (within reason)
    const limit = 1000; 
    
    const result = await tool.execute({
      category: category,
      limit: limit
    });
    
    if (result.isError) {
      console.error('Error executing tool:', result.content[0].text);
      process.exit(1);
    }
    
    const data = JSON.parse(result.content[0].text);
    
    // Generate Markdown
    let md = `# Category Report: ${category}\n\n`;
    md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
    md += `**Total Chunks Found:** ${data.total_chunks_found}\n\n`;
    
    md += `## Concepts in this Category\n`;
    if (data.concepts_in_category && data.concepts_in_category.length > 0) {
        md += data.concepts_in_category.map((c: string) => `- ${c}`).join('\n');
    } else {
        md += `No specific concepts listed for this category definition.`;
    }
    md += `\n\n`;
    
    md += `## Content by Document\n\n`;
    
    // Group by Source (Book)
    const chunksBySource: Record<string, any[]> = {};
    
    for (const chunk of data.results) {
        const source = chunk.source;
        if (!chunksBySource[source]) {
            chunksBySource[source] = [];
        }
        chunksBySource[source].push(chunk);
    }
    
    for (const [source, chunks] of Object.entries(chunksBySource)) {
        const filename = source.split('/').pop() || source;
        // Try to clean up filename to look more like a title if possible, or just use filename
        const title = filename.replace(/\.pdf$|\.epub$/, '').replace(/_/g, ' ');
        
        md += `### ${title}\n\n`;
        md += `*File: ${filename}*\n\n`;
        
        for (const chunk of chunks) {
            md += `> ${chunk.text.replace(/\n/g, '\n> ')}\n\n`;
            
            if (chunk.categories && chunk.categories.length > 0) {
                md += `**Categories:** ${chunk.categories.join(', ')}\n`;
            }
            if (chunk.concepts_in_chunk && chunk.concepts_in_chunk.length > 0) {
                md += `**Concepts:** ${chunk.concepts_in_chunk.join(', ')}\n`;
            }
            md += `\n---\n\n`;
        }
    }
    
    const outputPath = path.join(process.cwd(), '.engineering/artifacts/planning/2025-11-19-category-search-tool/2025-11-19-software-engineering-report.md');
    fs.writeFileSync(outputPath, md);
    
    console.log(`Report generated at: ${outputPath}`);
    
    await container.close();
    
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

main();






