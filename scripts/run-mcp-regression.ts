#!/usr/bin/env node
/**
 * MCP Tool Regression Test Runner
 * 
 * Runs comprehensive tests against all MCP tools and generates a comparison report.
 * Uses the built dist/ files to avoid ESM import issues.
 */

import { ApplicationContainer } from '../dist/application/container.js';
import * as fs from 'fs';

interface TestCase {
    tool: string;
    testName: string;
    input: Record<string, any>;
    output: any;
    passed: boolean;
    error?: string;
    scores?: Record<string, string>;
}

const testCases: TestCase[] = [];

// Test inputs spanning different documents
const TEST_INPUTS = {
    artOfWar: {
        concepts: ['military strategy', 'deception tactics warfare', 'terrain analysis military'],
        searches: ['war', 'military', 'battle'],
        document: 'Sun Tzu'
    },
    cleanArch: {
        concepts: ['software architecture', 'dependency', 'interface'],
        searches: ['architecture', 'clean', 'software'],
        document: 'Clean Architecture'
    },
    systems: {
        concepts: ['feedback loop', 'systems thinking', 'balancing feedback loop'],
        searches: ['system', 'feedback', 'dynamic'],
        document: 'Thinking in Systems'
    },
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
            passed: !result.isError,
            scores: output.scores || (Array.isArray(output) && output[0]?.scores)
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

async function main() {
    console.log('🧪 MCP Tool Regression Test');
    console.log('='.repeat(60));
    console.log('');
    
    const container = new ApplicationContainer();
    
    try {
        await container.initialize('./db/test');
        console.log('');
        
        // =====================
        // concept_search tests
        // =====================
        console.log('📋 Testing concept_search...');
        const conceptSearchTool = container.getTool('concept_search');
        
        for (const [key, data] of Object.entries(TEST_INPUTS)) {
            const tc = await runTest(conceptSearchTool, 'concept_search', `${data.document}: ${data.concepts[0]}`,
                { concept: data.concepts[0], limit: 3 });
            testCases.push(tc);
            const wordnetScore = tc.output?.scores?.wordnet || 'N/A';
            console.log(`  ${tc.passed ? '✅' : '❌'} ${tc.testName} (wordnet: ${wordnetScore})`);
        }
        
        // =====================
        // catalog_search tests
        // =====================
        console.log('\n📋 Testing catalog_search...');
        const catalogSearchTool = container.getTool('catalog_search');
        
        for (const [key, data] of Object.entries(TEST_INPUTS)) {
            const tc = await runTest(catalogSearchTool, 'catalog_search', `Search: ${data.searches[0]}`,
                { text: data.searches[0] });
            testCases.push(tc);
            const firstResult = Array.isArray(tc.output) ? tc.output[0] : null;
            const wordnetScore = firstResult?.scores?.wordnet || 'N/A';
            console.log(`  ${tc.passed ? '✅' : '❌'} ${tc.testName} (wordnet: ${wordnetScore})`);
        }
        
        // =====================
        // broad_chunks_search tests
        // =====================
        console.log('\n📋 Testing broad_chunks_search...');
        const broadChunksSearchTool = container.getTool('broad_chunks_search');
        
        const broadQueries = [
            { text: 'military strategy victory', desc: 'Military (Art of War)' },
            { text: 'software architecture layers', desc: 'Architecture (Clean Arch)' },
            { text: 'feedback loops systems', desc: 'Systems (Thinking in Systems)' },
            { text: 'design pattern factory', desc: 'Patterns (Design Patterns)' }
        ];
        
        for (const query of broadQueries) {
            const tc = await runTest(broadChunksSearchTool, 'broad_chunks_search', query.desc,
                { text: query.text, limit: 5 });
            testCases.push(tc);
            const firstResult = Array.isArray(tc.output) ? tc.output[0] : null;
            const wordnetScore = firstResult?.scores?.wordnet || 'N/A';
            console.log(`  ${tc.passed ? '✅' : '❌'} ${tc.testName} (wordnet: ${wordnetScore})`);
        }
        
        // =====================
        // Summary
        // =====================
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        
        const passed = testCases.filter(t => t.passed).length;
        const failed = testCases.filter(t => !t.passed).length;
        const total = testCases.length;
        
        console.log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        // WordNet score analysis
        console.log('\n📈 WordNet Score Analysis:');
        console.log('-'.repeat(60));
        
        let zeroScores = 0;
        let nonZeroScores = 0;
        let totalWordnetScore = 0;
        
        for (const tc of testCases) {
            let scores: Record<string, string> | undefined;
            
            if (tc.output?.scores) {
                scores = tc.output.scores;
            } else if (Array.isArray(tc.output) && tc.output[0]?.scores) {
                scores = tc.output[0].scores;
            }
            
            if (scores?.wordnet) {
                const score = parseFloat(scores.wordnet);
                if (score === 0) {
                    zeroScores++;
                } else {
                    nonZeroScores++;
                    totalWordnetScore += score;
                }
            }
        }
        
        console.log(`  Zero WordNet scores: ${zeroScores}`);
        console.log(`  Non-zero WordNet scores: ${nonZeroScores}`);
        if (nonZeroScores > 0) {
            console.log(`  Average non-zero WordNet score: ${(totalWordnetScore / nonZeroScores).toFixed(3)}`);
        }
        
        // Comparison note
        console.log('\n📋 Comparison with Previous Report:');
        console.log('-'.repeat(60));
        console.log('  Previous report had 22 instances of wordnet: "0.000"');
        console.log(`  Current run has ${zeroScores} zero WordNet scores`);
        
        if (zeroScores < 22) {
            console.log(`  ✅ IMPROVEMENT: ${22 - zeroScores} fewer zero scores`);
        } else if (zeroScores === 22) {
            console.log('  ⚪ NO CHANGE in zero score count');
        } else {
            console.log(`  ❌ REGRESSION: ${zeroScores - 22} more zero scores`);
        }
        
        await container.close();
        
        // Output detailed results for comparison
        console.log('\n📝 Detailed WordNet Scores by Test:');
        console.log('-'.repeat(60));
        for (const tc of testCases) {
            let wordnetScore = 'N/A';
            if (tc.output?.scores?.wordnet) {
                wordnetScore = tc.output.scores.wordnet;
            } else if (Array.isArray(tc.output) && tc.output[0]?.scores?.wordnet) {
                wordnetScore = tc.output[0].scores.wordnet;
            }
            console.log(`  ${tc.tool.padEnd(20)} | ${tc.testName.padEnd(35)} | wordnet: ${wordnetScore}`);
        }
        
    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        await container.close();
        process.exit(1);
    }
}

main();
