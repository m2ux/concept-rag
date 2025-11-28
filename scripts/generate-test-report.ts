/**
 * MCP Tool Test Report Generator
 * 
 * Generates a detailed test report showing:
 * - Input parameters for each test
 * - Full JSON output from tool calls
 * - Pass/fail status
 * 
 * Uses inputs spanning all documents in test_db:
 * - Sun Tzu - Art of War (military strategy)
 * - Clean Architecture (software architecture)
 * - Thinking in Systems (systems thinking)
 * - Design Patterns (OOP patterns)
 */

import { ApplicationContainer } from '../src/application/container.js';
import * as lancedb from '@lancedb/lancedb';
import * as fs from 'fs';

interface TestCase {
    tool: string;
    testName: string;
    input: Record<string, any>;
    output: any;
    passed: boolean;
    error?: string;
}

const testCases: TestCase[] = [];

// Concepts from each document
const TEST_INPUTS = {
    // Art of War concepts
    artOfWar: {
        concepts: ['military strategy', 'deception tactics warfare', 'terrain analysis military'],
        searches: ['war', 'military', 'battle'],
        document: 'Sun Tzu'
    },
    // Clean Architecture concepts  
    cleanArch: {
        concepts: ['software architecture', 'dependency', 'interface'],
        searches: ['architecture', 'clean', 'software'],
        document: 'Clean Architecture'
    },
    // Thinking in Systems concepts
    systems: {
        concepts: ['feedback loop', 'systems thinking', 'balancing feedback loop'],
        searches: ['system', 'feedback', 'dynamic'],
        document: 'Thinking in Systems'
    },
    // Design Patterns concepts
    patterns: {
        concepts: ['decorator pattern', 'design patterns', 'observer'],
        searches: ['pattern', 'design', 'factory'],
        document: 'Design Patterns'
    }
};

async function runTest(
    tool: any,
    toolName: string,
    testName: string,
    input: Record<string, any>
): Promise<TestCase> {
    try {
        const result = await tool.execute(input);
        const output = JSON.parse(result.content[0].text);
        return {
            tool: toolName,
            testName,
            input,
            output,
            passed: !result.isError
        };
    } catch (error: any) {
        return {
            tool: toolName,
            testName,
            input,
            output: null,
            passed: false,
            error: error.message
        };
    }
}

async function generateReport(container: ApplicationContainer): Promise<string> {
    const report: string[] = [];
    
    report.push('# MCP Tool Test Report - Detailed Output');
    report.push('');
    report.push(`**Generated:** ${new Date().toISOString()}`);
    report.push(`**Database:** ./test_db`);
    report.push('');
    report.push('---');
    report.push('');
    
    // =====================
    // concept_search tests
    // =====================
    report.push('## 1. concept_search');
    report.push('');
    report.push('Hybrid scoring: 40% name, 30% vector, 20% BM25, 10% synonyms');
    report.push('');
    
    const conceptSearchTool = container.getTool('concept_search');
    
    // Test with Art of War concept
    let tc = await runTest(conceptSearchTool, 'concept_search', 'Art of War concept', 
        { concept: TEST_INPUTS.artOfWar.concepts[0], limit: 3 });
    testCases.push(tc);
    report.push(`### Test 1.1: Art of War concept`);
    report.push('');
    report.push('**Input:**');
    report.push('```json');
    report.push(JSON.stringify(tc.input, null, 2));
    report.push('```');
    report.push('');
    report.push(`**Status:** ${tc.passed ? '✅ PASS' : '❌ FAIL'}`);
    report.push('');
    report.push('**Output:**');
    report.push('```json');
    report.push(JSON.stringify(tc.output, null, 2));
    report.push('```');
    report.push('');
    
    // Test with Clean Architecture concept
    tc = await runTest(conceptSearchTool, 'concept_search', 'Clean Architecture concept',
        { concept: TEST_INPUTS.cleanArch.concepts[0], limit: 3 });
    testCases.push(tc);
    report.push(`### Test 1.2: Clean Architecture concept`);
    report.push('');
    report.push('**Input:**');
    report.push('```json');
    report.push(JSON.stringify(tc.input, null, 2));
    report.push('```');
    report.push('');
    report.push(`**Status:** ${tc.passed ? '✅ PASS' : '❌ FAIL'}`);
    report.push('');
    report.push('**Output:**');
    report.push('```json');
    report.push(JSON.stringify(tc.output, null, 2));
    report.push('```');
    report.push('');
    
    // Test with Systems concept
    tc = await runTest(conceptSearchTool, 'concept_search', 'Systems Thinking concept',
        { concept: TEST_INPUTS.systems.concepts[0], limit: 3 });
    testCases.push(tc);
    report.push(`### Test 1.3: Systems Thinking concept`);
    report.push('');
    report.push('**Input:**');
    report.push('```json');
    report.push(JSON.stringify(tc.input, null, 2));
    report.push('```');
    report.push('');
    report.push(`**Status:** ${tc.passed ? '✅ PASS' : '❌ FAIL'}`);
    report.push('');
    report.push('**Output:**');
    report.push('```json');
    report.push(JSON.stringify(tc.output, null, 2));
    report.push('```');
    report.push('');
    
    // Test with Design Patterns concept
    tc = await runTest(conceptSearchTool, 'concept_search', 'Design Patterns concept',
        { concept: TEST_INPUTS.patterns.concepts[0], limit: 3 });
    testCases.push(tc);
    report.push(`### Test 1.4: Design Patterns concept`);
    report.push('');
    report.push('**Input:**');
    report.push('```json');
    report.push(JSON.stringify(tc.input, null, 2));
    report.push('```');
    report.push('');
    report.push(`**Status:** ${tc.passed ? '✅ PASS' : '❌ FAIL'}`);
    report.push('');
    report.push('**Output:**');
    report.push('```json');
    report.push(JSON.stringify(tc.output, null, 2));
    report.push('```');
    report.push('');
    
    report.push('---');
    report.push('');
    
    // =====================
    // catalog_search tests
    // =====================
    report.push('## 2. catalog_search');
    report.push('');
    report.push('Hybrid scoring: 30% vector, 30% BM25, 25% title, 15% WordNet');
    report.push('');
    
    const catalogSearchTool = container.getTool('catalog_search');
    
    // Search for each document type
    for (const [key, data] of Object.entries(TEST_INPUTS)) {
        tc = await runTest(catalogSearchTool, 'catalog_search', `Search: ${data.searches[0]}`,
            { text: data.searches[0] });
        testCases.push(tc);
        report.push(`### Test 2.${Object.keys(TEST_INPUTS).indexOf(key) + 1}: ${data.searches[0]}`);
        report.push('');
        report.push('**Input:**');
        report.push('```json');
        report.push(JSON.stringify(tc.input, null, 2));
        report.push('```');
        report.push('');
        report.push(`**Status:** ${tc.passed ? '✅ PASS' : '❌ FAIL'}`);
        report.push('');
        report.push('**Output:**');
        report.push('```json');
        report.push(JSON.stringify(tc.output, null, 2));
        report.push('```');
        report.push('');
    }
    
    report.push('---');
    report.push('');
    
    // =====================
    // broad_chunks_search tests
    // =====================
    report.push('## 3. broad_chunks_search');
    report.push('');
    report.push('Hybrid scoring: 40% vector, 40% BM25, 20% WordNet (no title)');
    report.push('');
    
    const broadChunksSearchTool = container.getTool('broad_chunks_search');
    
    // Test with diverse queries
    const broadQueries = [
        { text: 'military strategy victory', desc: 'Military (Art of War)' },
        { text: 'software architecture layers', desc: 'Architecture (Clean Architecture)' },
        { text: 'feedback loops systems', desc: 'Systems (Thinking in Systems)' },
        { text: 'design pattern factory', desc: 'Patterns (Design Patterns)' }
    ];
    
    for (let i = 0; i < broadQueries.length; i++) {
        tc = await runTest(broadChunksSearchTool, 'broad_chunks_search', broadQueries[i].desc,
            { text: broadQueries[i].text, limit: 5 });
        testCases.push(tc);
        report.push(`### Test 3.${i + 1}: ${broadQueries[i].desc}`);
        report.push('');
        report.push('**Input:**');
        report.push('```json');
        report.push(JSON.stringify(tc.input, null, 2));
        report.push('```');
        report.push('');
        report.push(`**Status:** ${tc.passed ? '✅ PASS' : '❌ FAIL'}`);
        report.push('');
        report.push('**Output:**');
        report.push('```json');
        report.push(JSON.stringify(tc.output, null, 2));
        report.push('```');
        report.push('');
    }
    
    report.push('---');
    report.push('');
    
    // =====================
    // extract_concepts tests
    // =====================
    report.push('## 4. extract_concepts');
    report.push('');
    
    const extractConceptsTool = container.getTool('extract_concepts');
    
    // Extract from each document
    const docs = ['Sun Tzu', 'Clean Architecture', 'Thinking in Systems', 'Design Patterns'];
    
    for (let i = 0; i < docs.length; i++) {
        tc = await runTest(extractConceptsTool, 'extract_concepts', `Extract: ${docs[i]}`,
            { document_query: docs[i] });
        testCases.push(tc);
        report.push(`### Test 4.${i + 1}: ${docs[i]}`);
        report.push('');
        report.push('**Input:**');
        report.push('```json');
        report.push(JSON.stringify(tc.input, null, 2));
        report.push('```');
        report.push('');
        report.push(`**Status:** ${tc.passed ? '✅ PASS' : '❌ FAIL'}`);
        report.push('');
        report.push('**Output (truncated to first 10 concepts):**');
        report.push('```json');
        // Truncate output for readability
        const truncated = { ...tc.output };
        if (truncated.primary_concepts?.length > 10) {
            truncated.primary_concepts = truncated.primary_concepts.slice(0, 10);
            truncated._note = `Showing 10 of ${tc.output.primary_concepts.length} concepts`;
        }
        report.push(JSON.stringify(truncated, null, 2));
        report.push('```');
        report.push('');
    }
    
    report.push('---');
    report.push('');
    
    // =====================
    // list_categories test
    // =====================
    report.push('## 5. list_categories');
    report.push('');
    
    const listCategoriesTool = container.getTool('list_categories');
    
    tc = await runTest(listCategoriesTool, 'list_categories', 'List all categories', {});
    testCases.push(tc);
    report.push(`### Test 5.1: List all categories`);
    report.push('');
    report.push('**Input:**');
    report.push('```json');
    report.push(JSON.stringify(tc.input, null, 2));
    report.push('```');
    report.push('');
    report.push(`**Status:** ${tc.passed ? '✅ PASS' : '❌ FAIL'}`);
    report.push('');
    report.push('**Output:**');
    report.push('```json');
    report.push(JSON.stringify(tc.output, null, 2));
    report.push('```');
    report.push('');
    
    report.push('---');
    report.push('');
    
    // =====================
    // category_search tests
    // =====================
    report.push('## 6. category_search');
    report.push('');
    
    const categorySearchTool = container.getTool('category_search');
    
    const categories = ['military strategy', 'software architecture', 'systems thinking', 'design patterns'];
    
    for (let i = 0; i < categories.length; i++) {
        tc = await runTest(categorySearchTool, 'category_search', `Category: ${categories[i]}`,
            { category: categories[i] });
        testCases.push(tc);
        report.push(`### Test 6.${i + 1}: ${categories[i]}`);
        report.push('');
        report.push('**Input:**');
        report.push('```json');
        report.push(JSON.stringify(tc.input, null, 2));
        report.push('```');
        report.push('');
        report.push(`**Status:** ${tc.passed ? '✅ PASS' : '❌ FAIL'}`);
        report.push('');
        report.push('**Output:**');
        report.push('```json');
        report.push(JSON.stringify(tc.output, null, 2));
        report.push('```');
        report.push('');
    }
    
    report.push('---');
    report.push('');
    
    // =====================
    // Summary
    // =====================
    report.push('## Summary');
    report.push('');
    
    const passed = testCases.filter(t => t.passed).length;
    const failed = testCases.filter(t => !t.passed).length;
    const total = testCases.length;
    
    report.push(`| Metric | Value |`);
    report.push(`|--------|-------|`);
    report.push(`| Total Tests | ${total} |`);
    report.push(`| Passed | ${passed} |`);
    report.push(`| Failed | ${failed} |`);
    report.push(`| Success Rate | ${((passed / total) * 100).toFixed(1)}% |`);
    report.push('');
    
    if (failed > 0) {
        report.push('### Failed Tests');
        report.push('');
        for (const tc of testCases.filter(t => !t.passed)) {
            report.push(`- **${tc.tool}** - ${tc.testName}: ${tc.error || 'Unknown error'}`);
        }
    }
    
    return report.join('\n');
}

async function main() {
    console.log('🧪 Generating MCP Tool Test Report...');
    console.log('');
    
    const container = new ApplicationContainer();
    
    try {
        await container.initialize('./test_db');
        console.log('');
        
        const report = await generateReport(container);
        
        // Write report to file
        const reportPath = '.ai/planning/2025-11-28-schema-redesign/mcp-tool-test-report.md';
        fs.writeFileSync(reportPath, report);
        
        console.log(`✅ Report written to ${reportPath}`);
        console.log('');
        
        // Also output to console
        console.log(report);
        
        await container.close();
        
    } catch (error: any) {
        console.error('❌ Report generation failed:', error.message);
        await container.close();
        process.exit(1);
    }
}

main();

