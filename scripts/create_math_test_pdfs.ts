/**
 * Test PDF Generator for Mathematical Symbols
 * 
 * Creates sample PDF files with mathematical symbols for testing:
 * 1. Regular text-based PDF with Unicode symbols
 * 2. Instructions for creating OCR-scanned PDF manually
 * 
 * **Purpose:**
 * - Test mathematical symbol preservation in document loaders
 * - Compare regular vs OCR PDF processing
 * - Validate Unicode handling in pdf-parse and Tesseract
 * 
 * **Usage:**
 * ```bash
 * npx tsx scripts/create_math_test_pdfs.ts
 * ```
 * 
 * **Requirements:**
 * - Node.js with TypeScript support
 * - For OCR testing: Manually create scanned PDFs or use provided instructions
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const TEST_DATA_DIR = path.join(process.cwd(), 'test-data', 'mathematical-symbols');

// Mathematical content for testing
const MATHEMATICAL_CONTENT = {
  title: 'Mathematical Symbols Test Document',
  sections: [
    {
      heading: '1. Basic ASCII Mathematical Symbols',
      content: `
Basic operators: + - * / = < > ^ _ ~ | \\ % @
Parentheses: ( ) [ ] { }
Comparison: < > <= >= == !=
Expressions: 2 + 2 = 4, 5 - 3 = 2, 3 * 4 = 12, 8 / 2 = 4
Exponents: x^2, y^3, z^n
Subscripts: x_1, x_2, x_n
      `.trim()
    },
    {
      heading: '2. Extended Mathematical Operators (Unicode)',
      content: `
Plus-minus: ±
Multiplication: ×
Division: ÷
Not equal: ≠
Less/greater or equal: ≤ ≥
Approximately equal: ≈
Equivalent: ≡
Proportional: ∝
Infinity: ∞
      `.trim()
    },
    {
      heading: '3. Greek Letters (Mathematical)',
      content: `
Lowercase: α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω
Uppercase: Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω

Common usage:
- α (alpha): angles, coefficients
- β (beta): angles, coefficients
- γ (gamma): Euler's constant
- δ (delta): change, difference
- ε (epsilon): small quantity
- π (pi): 3.14159...
- σ (sigma): standard deviation
- Σ (Sigma): summation
- Δ (Delta): change, difference
- Π (Pi): product
      `.trim()
    },
    {
      heading: '4. Calculus and Analysis Symbols',
      content: `
Integral: ∫ f(x) dx
Double integral: ∬
Triple integral: ∭
Contour integral: ∮
Summation: ∑ aᵢ
Product: ∏ bᵢ
Partial derivative: ∂f/∂x
Nabla/gradient: ∇f
Square root: √x, √2, √π
Nth root: ∛x, ∜x
Infinity: ∞
Limit: lim (x→∞)
      `.trim()
    },
    {
      heading: '5. Logic Symbols',
      content: `
Universal quantifier: ∀x
Existential quantifier: ∃x
Logical AND: ∧
Logical OR: ∨
Logical NOT: ¬
Implies: ⇒
If and only if: ⇔
Therefore: ∴
Because: ∵
True: ⊤
False: ⊥
      `.trim()
    },
    {
      heading: '6. Set Theory Symbols',
      content: `
Element of: x ∈ S
Not element of: x ∉ S
Subset: A ⊂ B
Proper subset: A ⊊ B
Superset: B ⊃ A
Subset or equal: A ⊆ B
Superset or equal: B ⊇ A
Union: A ∪ B
Intersection: A ∩ B
Empty set: ∅
Set difference: A \\ B
Complement: Aᶜ
Power set: P(A)
Cardinality: |A|
      `.trim()
    },
    {
      heading: '7. Complex Mathematical Expressions',
      content: `
Quadratic formula: x = (-b ± √(b² - 4ac)) / 2a
Euler's identity: e^(iπ) + 1 = 0
Pythagorean theorem: a² + b² = c²
Area of circle: A = πr²
Maxwell's equations:
  ∇ · E = ρ/ε₀
  ∇ · B = 0
  ∇ × E = -∂B/∂t
  ∇ × B = μ₀J + μ₀ε₀∂E/∂t
      `.trim()
    },
    {
      heading: '8. Real Number Sets',
      content: `
Natural numbers: ℕ = {0, 1, 2, 3, ...}
Integers: ℤ = {..., -2, -1, 0, 1, 2, ...}
Rational numbers: ℚ
Real numbers: ℝ
Complex numbers: ℂ
Prime numbers: ℙ
      `.trim()
    }
  ]
};

/**
 * Generate plain text content for PDF creation
 */
function generateTextContent(): string {
  let content = `${MATHEMATICAL_CONTENT.title}\n`;
  content += '='.repeat(MATHEMATICAL_CONTENT.title.length) + '\n\n';
  content += 'Test document for mathematical symbol preservation in PDF loaders\n\n';
  
  for (const section of MATHEMATICAL_CONTENT.sections) {
    content += `\n${section.heading}\n`;
    content += '-'.repeat(section.heading.length) + '\n';
    content += section.content + '\n';
  }
  
  content += '\n\nEnd of Test Document\n';
  return content;
}

/**
 * Generate HTML content for PDF creation (can be converted to PDF)
 */
function generateHtmlContent(): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${MATHEMATICAL_CONTENT.title}</title>
    <style>
        body {
            font-family: "Times New Roman", serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        h2 {
            border-bottom: 1px solid #666;
            margin-top: 30px;
        }
        .subtitle {
            text-align: center;
            color: #666;
            font-style: italic;
            margin-bottom: 40px;
        }
        pre {
            background: #f5f5f5;
            padding: 15px;
            border-left: 3px solid #333;
            overflow-x: auto;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h1>${MATHEMATICAL_CONTENT.title}</h1>
    <p class="subtitle">Test document for mathematical symbol preservation in PDF loaders</p>
`;

  for (const section of MATHEMATICAL_CONTENT.sections) {
    html += `    <h2>${section.heading}</h2>\n`;
    html += `    <pre>${section.content}</pre>\n`;
  }

  html += `    <p style="text-align: center; margin-top: 50px; color: #999;">
        End of Test Document
    </p>
</body>
</html>`;

  return html;
}

/**
 * Generate instructions for creating OCR test PDF
 */
function generateOcrInstructions(): string {
  return `# Instructions for Creating OCR Test PDF

## Purpose
Create a scanned/image-based PDF to test Tesseract OCR's ability to recognize mathematical symbols.

## Method 1: Print and Scan
1. Open math-symbols-test.html in a web browser
2. Print to paper
3. Scan the paper to PDF
4. Save as: test-data/mathematical-symbols/math-symbols-ocr-scanned.pdf

## Method 2: Screenshot to PDF
1. Open math-symbols-test.html in a web browser
2. Take screenshots of the entire page
3. Use an image-to-PDF tool to convert screenshots
4. Save as: test-data/mathematical-symbols/math-symbols-ocr-scanned.pdf

## Method 3: Convert HTML → Image → PDF
Using command-line tools:

\`\`\`bash
# Install wkhtmltoimage and ImageMagick (Ubuntu/Debian)
sudo apt install wkhtmltopdf imagemagick

# Convert HTML to image
wkhtmltoimage math-symbols-test.html math-symbols.png

# Convert image to PDF (as image-based, not text)
convert math-symbols.png math-symbols-ocr-scanned.pdf
\`\`\`

## Expected Results
When this OCR PDF is processed:
- ✅ Basic ASCII symbols should be preserved: + - * / = < >
- ❌ Unicode symbols will likely be lost or corrupted: ∫ ∑ α β π
- ⚠️  Greek letters may become Latin: α → a, β → B
- ⚠️  Operators may be simplified: × → x, ÷ → /

This is expected behavior documenting Tesseract's limitations with mathematical Unicode.

## Verification
After creating the OCR PDF:
1. Run: npx tsx scripts/test_math_symbol_extraction.ts
2. Check console output for symbol preservation comparison
3. Review metadata.ocr_processed and metadata.ocr_confidence flags
`;
}

/**
 * Generate test script to verify symbol extraction
 */
function generateTestScript(): string {
  return `/**
 * Test Mathematical Symbol Extraction
 * 
 * Loads test PDFs and reports which symbols were preserved.
 */

import { PDFDocumentLoader } from '../src/infrastructure/document-loaders/pdf-loader.js';
import * as path from 'path';

const TEST_SYMBOLS = {
  ascii: ['+', '-', '*', '/', '=', '<', '>'],
  operators: ['±', '×', '÷', '≠', '≤', '≥', '≈'],
  greek: ['α', 'β', 'γ', 'δ', 'π', 'σ', 'Σ', 'Π'],
  calculus: ['∫', '∑', '∏', '∂', '∇', '√', '∞']
};

async function testPdf(pdfPath: string, expectedType: string) {
  console.log(\`\\nTesting: \${path.basename(pdfPath)}\`);
  console.log(\`Expected type: \${expectedType}\`);
  console.log('-'.repeat(60));
  
  try {
    const loader = new PDFDocumentLoader();
    const documents = await loader.load(pdfPath);
    
    console.log(\`Pages loaded: \${documents.length}\`);
    
    const fullText = documents.map(doc => doc.pageContent).join(' ');
    const metadata = documents[0]?.metadata || {};
    
    console.log(\`OCR processed: \${metadata.ocr_processed || false}\`);
    if (metadata.ocr_processed) {
      console.log(\`OCR method: \${metadata.ocr_method}\`);
      console.log(\`OCR confidence: \${metadata.ocr_confidence}\`);
    }
    
    console.log('\\nSymbol preservation:');
    for (const [category, symbols] of Object.entries(TEST_SYMBOLS)) {
      const preserved = symbols.filter(s => fullText.includes(s));
      const rate = (preserved.length / symbols.length * 100).toFixed(0);
      console.log(\`  \${category}: \${preserved.length}/\${symbols.length} (\${rate}%)\`);
      console.log(\`    Preserved: \${preserved.join(' ')}\`);
    }
  } catch (error: any) {
    console.error(\`Error: \${error.message}\`);
  }
}

async function main() {
  const testDir = path.join(process.cwd(), 'test-data', 'mathematical-symbols');
  
  // Test regular text-based PDF
  const regularPdf = path.join(testDir, 'math-symbols-regular.pdf');
  await testPdf(regularPdf, 'Regular text-based PDF');
  
  // Test OCR-scanned PDF (if exists)
  const ocrPdf = path.join(testDir, 'math-symbols-ocr-scanned.pdf');
  try {
    await testPdf(ocrPdf, 'OCR-scanned PDF');
  } catch {
    console.log('\\nOCR test PDF not found. Create it using OCR_INSTRUCTIONS.md');
  }
}

main().catch(console.error);
`;
}

/**
 * Main execution
 */
async function main() {
  console.log('Creating test data directory...');
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  
  // Generate text file
  console.log('Generating text content...');
  const textContent = generateTextContent();
  await fs.writeFile(
    path.join(TEST_DATA_DIR, 'math-symbols-content.txt'),
    textContent,
    'utf-8'
  );
  
  // Generate HTML file (can be converted to PDF)
  console.log('Generating HTML file...');
  const htmlContent = generateHtmlContent();
  await fs.writeFile(
    path.join(TEST_DATA_DIR, 'math-symbols-test.html'),
    htmlContent,
    'utf-8'
  );
  
  // Generate OCR instructions
  console.log('Generating OCR instructions...');
  const ocrInstructions = generateOcrInstructions();
  await fs.writeFile(
    path.join(TEST_DATA_DIR, 'OCR_INSTRUCTIONS.md'),
    ocrInstructions,
    'utf-8'
  );
  
  // Generate test script
  console.log('Generating test script...');
  const testScript = generateTestScript();
  await fs.writeFile(
    path.join(process.cwd(), 'scripts', 'test_math_symbol_extraction.ts'),
    testScript,
    'utf-8'
  );
  
  console.log('\n✅ Test files created successfully!');
  console.log('\nGenerated files:');
  console.log(`  - ${path.join(TEST_DATA_DIR, 'math-symbols-content.txt')}`);
  console.log(`  - ${path.join(TEST_DATA_DIR, 'math-symbols-test.html')}`);
  console.log(`  - ${path.join(TEST_DATA_DIR, 'OCR_INSTRUCTIONS.md')}`);
  console.log(`  - ${path.join(process.cwd(), 'scripts', 'test_math_symbol_extraction.ts')}`);
  
  console.log('\nNext steps:');
  console.log('1. Convert math-symbols-test.html to PDF:');
  console.log('   - Open in browser and print to PDF');
  console.log('   - Save as: test-data/mathematical-symbols/math-symbols-regular.pdf');
  console.log('\n2. Create OCR test PDF (see OCR_INSTRUCTIONS.md)');
  console.log('\n3. Run tests:');
  console.log('   npx vitest src/infrastructure/document-loaders/__tests__/mathematical-symbols.test.ts');
  console.log('   npx tsx scripts/test_math_symbol_extraction.ts');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { generateTextContent, generateHtmlContent, generateOcrInstructions };

