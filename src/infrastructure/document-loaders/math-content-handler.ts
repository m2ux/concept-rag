/**
 * Mathematical Content Handler
 * 
 * Detects, cleans, and marks mathematical content in research papers.
 * Useful for identifying chunks that may need special handling in search
 * or may have extraction quality issues.
 * 
 * **Detection Strategy:**
 * - Greek letters (α, β, γ, etc.)
 * - Mathematical symbols (∑, ∏, ∫, ∂, etc.)
 * - LaTeX-style notation that leaked through
 * - Equation-like patterns (x = y, f(x), etc.)
 * - Subscript/superscript Unicode characters
 * 
 * **Cleaning Strategy:**
 * - Normalize Unicode math symbols to ASCII equivalents where sensible
 * - Clean up common ligature issues
 * - Remove orphaned LaTeX commands
 * - Normalize whitespace around operators
 * 
 * @example
 * ```typescript
 * const handler = new MathContentHandler();
 * const analysis = handler.analyze(text);
 * console.log(analysis.hasMath);     // true
 * console.log(analysis.mathScore);   // 0.15
 * console.log(analysis.cleanedText); // Normalized text
 * ```
 */

/**
 * Result of mathematical content analysis.
 */
export interface MathAnalysisResult {
  /** Whether significant math content was detected */
  hasMath: boolean;
  
  /** Math density score (0-1), ratio of math-related content */
  mathScore: number;
  
  /** Types of math content found */
  mathTypes: string[];
  
  /** Cleaned/normalized text */
  cleanedText: string;
  
  /** Number of issues cleaned */
  cleanedIssues: number;
  
  /** Whether garbled/corrupted math was detected (PDF extraction issue) */
  hasExtractionIssues: boolean;
}

/**
 * Handles detection and cleaning of mathematical content.
 */
export class MathContentHandler {
  // Greek letters (lowercase and uppercase)
  private readonly GREEK_LETTERS = /[αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]/g;
  
  // Mathematical Alphanumeric Symbols (U+1D400-U+1D7FF)
  // These are styled mathematical letters (italic, bold, script, etc.)
  // Common in LaTeX-generated PDFs
  private readonly MATH_ALPHANUMERIC = /[\u{1D400}-\u{1D7FF}]/gu;
  
  // Garbled math characters - these are Hangul syllables that often result from
  // broken surrogate pair extraction in PDF libraries. Common mappings:
  // U+D400-D4FF range often contains garbled mathematical italic letters
  // This is a heuristic to detect PDFs with extraction issues
  private readonly GARBLED_MATH_HANGUL = /[\uD400-\uD7FF]/g;
  
  // Mathematical operators and symbols
  private readonly MATH_SYMBOLS = /[∑∏∫∬∭∮∂∇√∛∜∞≈≠≡≢≤≥≪≫±∓×÷∧∨¬∀∃∈∉⊂⊃⊆⊇∪∩⊕⊗⊥∥∠△□◇○●]/g;
  
  // Subscript and superscript characters
  private readonly SUB_SUPER = /[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₔₕₖₗₘₙₚₛₜ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ]/g;
  
  // LaTeX commands that leaked through
  private readonly LATEX_COMMANDS = /\\[a-zA-Z]+(?:\{[^}]*\})?/g;
  
  // Equation-like patterns
  private readonly EQUATION_PATTERNS = [
    /\b[a-zA-Z]\s*[=<>≤≥≠≈]\s*[a-zA-Z0-9]/g,  // x = y, a < b
    /\b[a-zA-Z]\s*\(\s*[a-zA-Z]\s*\)/g,         // f(x), g(y)
    /\b[a-zA-Z]_\{?[a-zA-Z0-9]+\}?/g,           // x_i, y_{ij}
    /\b[a-zA-Z]\^\{?[a-zA-Z0-9]+\}?/g,          // x^2, y^{n}
    /\blim\b|\bmax\b|\bmin\b|\bsup\b|\binf\b/gi, // Limit operations
    /\bE\s*\[|\bP\s*\(|\bVar\s*\(|\bCov\s*\(/g,  // Statistical notation
  ];
  
  // Common ligature issues to clean
  private readonly LIGATURE_MAP: Record<string, string> = {
    '\uFB01': 'fi',  // ﬁ ligature
    '\uFB02': 'fl',  // ﬂ ligature
    '\uFB00': 'ff',  // ﬀ ligature
    '\uFB03': 'ffi', // ﬃ ligature
    '\uFB04': 'ffl', // ﬄ ligature
    '\u2026': '...', // … ellipsis
    '\u2013': '-',   // – en dash
    '\u2014': '--',  // — em dash
    '\u201C': '"',   // " left double quote
    '\u201D': '"',   // " right double quote
    '\u2018': "'",   // ' left single quote
    '\u2019': "'",   // ' right single quote
  };
  
  // Greek to ASCII approximations (for search matching)
  private readonly GREEK_ASCII_MAP: Record<string, string> = {
    'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
    'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
    'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
    'ν': 'nu', 'ξ': 'xi', 'π': 'pi', 'ρ': 'rho',
    'σ': 'sigma', 'τ': 'tau', 'υ': 'upsilon', 'φ': 'phi',
    'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',
  };
  
  /**
   * Recover garbled math characters from broken PDF extraction.
   * 
   * Some PDF libraries incorrectly extract Mathematical Alphanumeric Symbols
   * (U+1D400-U+1D7FF) as Hangul syllables (U+D400-U+D7FF) by dropping the
   * high bit (0x10000). This function recovers the original characters.
   * 
   * @param text - Text with potentially garbled math characters
   * @returns Text with recovered mathematical symbols
   */
  recoverGarbledMath(text: string): string {
    return text.replace(this.GARBLED_MATH_HANGUL, (char) => {
      const code = char.charCodeAt(0);
      // Add 0x10000 to recover the original SMP character
      return String.fromCodePoint(code + 0x10000);
    });
  }
  
  /**
   * Convert Mathematical Alphanumeric Symbol to ASCII equivalent.
   * These are Unicode characters U+1D400-U+1D7FF used in LaTeX PDFs.
   */
  private normalizeMathAlphanumeric(char: string): string {
    const code = char.codePointAt(0);
    if (!code || code < 0x1D400 || code > 0x1D7FF) return char;
    
    // Mathematical Bold (A-Z: 1D400-1D419, a-z: 1D41A-1D433)
    if (code >= 0x1D400 && code <= 0x1D419) return String.fromCharCode(65 + (code - 0x1D400));
    if (code >= 0x1D41A && code <= 0x1D433) return String.fromCharCode(97 + (code - 0x1D41A));
    
    // Mathematical Italic (A-Z: 1D434-1D44D, a-z: 1D44E-1D467)
    if (code >= 0x1D434 && code <= 0x1D44D) return String.fromCharCode(65 + (code - 0x1D434));
    if (code >= 0x1D44E && code <= 0x1D467) return String.fromCharCode(97 + (code - 0x1D44E));
    
    // Mathematical Bold Italic (A-Z: 1D468-1D481, a-z: 1D482-1D49B)
    if (code >= 0x1D468 && code <= 0x1D481) return String.fromCharCode(65 + (code - 0x1D468));
    if (code >= 0x1D482 && code <= 0x1D49B) return String.fromCharCode(97 + (code - 0x1D482));
    
    // Mathematical Sans-Serif (various ranges)
    if (code >= 0x1D5A0 && code <= 0x1D5B9) return String.fromCharCode(65 + (code - 0x1D5A0));
    if (code >= 0x1D5BA && code <= 0x1D5D3) return String.fromCharCode(97 + (code - 0x1D5BA));
    
    // Mathematical Sans-Serif Bold
    if (code >= 0x1D5D4 && code <= 0x1D5ED) return String.fromCharCode(65 + (code - 0x1D5D4));
    if (code >= 0x1D5EE && code <= 0x1D607) return String.fromCharCode(97 + (code - 0x1D5EE));
    
    // Mathematical Sans-Serif Italic
    if (code >= 0x1D608 && code <= 0x1D621) return String.fromCharCode(65 + (code - 0x1D608));
    if (code >= 0x1D622 && code <= 0x1D63B) return String.fromCharCode(97 + (code - 0x1D622));
    
    // Mathematical Monospace (A-Z: 1D670-1D689, a-z: 1D68A-1D6A3)
    if (code >= 0x1D670 && code <= 0x1D689) return String.fromCharCode(65 + (code - 0x1D670));
    if (code >= 0x1D68A && code <= 0x1D6A3) return String.fromCharCode(97 + (code - 0x1D68A));
    
    // Mathematical Bold Digits (0-9: 1D7CE-1D7D7)
    if (code >= 0x1D7CE && code <= 0x1D7D7) return String.fromCharCode(48 + (code - 0x1D7CE));
    
    // Mathematical Double-Struck Digits (0-9: 1D7D8-1D7E1)
    if (code >= 0x1D7D8 && code <= 0x1D7E1) return String.fromCharCode(48 + (code - 0x1D7D8));
    
    // Mathematical Sans-Serif Bold Digits (0-9: 1D7EC-1D7F5)
    if (code >= 0x1D7EC && code <= 0x1D7F5) return String.fromCharCode(48 + (code - 0x1D7EC));
    
    // Mathematical Monospace Digits (0-9: 1D7F6-1D7FF)
    if (code >= 0x1D7F6 && code <= 0x1D7FF) return String.fromCharCode(48 + (code - 0x1D7F6));
    
    // Mathematical Bold Greek (uppercase: 1D6A8-1D6C0, lowercase: 1D6C2-1D6DA)
    // Map to regular Greek letters then to ASCII names
    if (code >= 0x1D6A8 && code <= 0x1D6C0) {
      // Bold uppercase Greek: Α-Ω (skip final sigma at 1D6C1)
      const greekOffset = code - 0x1D6A8;
      const greekBase = 0x0391; // Greek Capital Alpha
      return String.fromCharCode(greekBase + greekOffset);
    }
    if (code >= 0x1D6C2 && code <= 0x1D6DA) {
      // Bold lowercase Greek: α-ω
      const greekOffset = code - 0x1D6C2;
      const greekBase = 0x03B1; // Greek Small Alpha
      return String.fromCharCode(greekBase + greekOffset);
    }
    
    // Mathematical Italic Greek (uppercase: 1D6E2-1D6FA, lowercase: 1D6FC-1D714)
    if (code >= 0x1D6E2 && code <= 0x1D6FA) {
      const greekOffset = code - 0x1D6E2;
      const greekBase = 0x0391;
      return String.fromCharCode(greekBase + greekOffset);
    }
    if (code >= 0x1D6FC && code <= 0x1D714) {
      const greekOffset = code - 0x1D6FC;
      const greekBase = 0x03B1;
      return String.fromCharCode(greekBase + greekOffset);
    }
    
    // Mathematical Bold Italic Greek (uppercase: 1D71C-1D734, lowercase: 1D736-1D74E)
    if (code >= 0x1D71C && code <= 0x1D734) {
      const greekOffset = code - 0x1D71C;
      const greekBase = 0x0391;
      return String.fromCharCode(greekBase + greekOffset);
    }
    if (code >= 0x1D736 && code <= 0x1D74E) {
      const greekOffset = code - 0x1D736;
      const greekBase = 0x03B1;
      return String.fromCharCode(greekBase + greekOffset);
    }
    
    // Mathematical Sans-Serif Bold Greek (uppercase: 1D756-1D76E, lowercase: 1D770-1D788)
    if (code >= 0x1D756 && code <= 0x1D76E) {
      const greekOffset = code - 0x1D756;
      const greekBase = 0x0391;
      return String.fromCharCode(greekBase + greekOffset);
    }
    if (code >= 0x1D770 && code <= 0x1D788) {
      const greekOffset = code - 0x1D770;
      const greekBase = 0x03B1;
      return String.fromCharCode(greekBase + greekOffset);
    }
    
    // Mathematical Sans-Serif Bold Italic Greek (uppercase: 1D790-1D7A8, lowercase: 1D7AA-1D7C2)
    if (code >= 0x1D790 && code <= 0x1D7A8) {
      const greekOffset = code - 0x1D790;
      const greekBase = 0x0391;
      return String.fromCharCode(greekBase + greekOffset);
    }
    if (code >= 0x1D7AA && code <= 0x1D7C2) {
      const greekOffset = code - 0x1D7AA;
      const greekBase = 0x03B1;
      return String.fromCharCode(greekBase + greekOffset);
    }
    
    return char;
  }

  /**
   * Analyze text for mathematical content.
   * 
   * @param text - The text to analyze
   * @returns Analysis result with detection and cleaned text
   */
  analyze(text: string): MathAnalysisResult {
    const mathTypes: string[] = [];
    let totalMathChars = 0;
    
    // Count Greek letters
    const greekMatches = text.match(this.GREEK_LETTERS);
    if (greekMatches && greekMatches.length > 0) {
      mathTypes.push('greek_letters');
      totalMathChars += greekMatches.length;
    }
    
    // Count Mathematical Alphanumeric Symbols (styled math letters from LaTeX)
    const mathAlphaMatches = text.match(this.MATH_ALPHANUMERIC);
    if (mathAlphaMatches && mathAlphaMatches.length > 0) {
      mathTypes.push('math_alphanumeric');
      totalMathChars += mathAlphaMatches.length;
    }
    
    // Check for garbled math (broken surrogate pairs from PDF extraction)
    // These appear as unexpected Hangul syllables
    const garbledMatches = text.match(this.GARBLED_MATH_HANGUL);
    if (garbledMatches && garbledMatches.length > 3) {
      // Only flag if we see multiple instances (avoid false positives from actual Korean)
      // Check if it looks like math context (mixed with numbers, operators)
      const hasNumbersNearby = /[\uD400-\uD7FF]\s*[=+\-*/0-9]|[0-9=+\-*/]\s*[\uD400-\uD7FF]/.test(text);
      if (hasNumbersNearby) {
        mathTypes.push('garbled_math');
        totalMathChars += garbledMatches.length;
      }
    }
    
    // Count math symbols
    const symbolMatches = text.match(this.MATH_SYMBOLS);
    if (symbolMatches && symbolMatches.length > 0) {
      mathTypes.push('math_symbols');
      totalMathChars += symbolMatches.length;
    }
    
    // Count sub/superscripts
    const subSuperMatches = text.match(this.SUB_SUPER);
    if (subSuperMatches && subSuperMatches.length > 0) {
      mathTypes.push('subscripts_superscripts');
      totalMathChars += subSuperMatches.length;
    }
    
    // Count LaTeX commands
    const latexMatches = text.match(this.LATEX_COMMANDS);
    if (latexMatches && latexMatches.length > 0) {
      mathTypes.push('latex_commands');
      totalMathChars += latexMatches.reduce((sum, m) => sum + m.length, 0);
    }
    
    // Count equation patterns
    let equationCount = 0;
    for (const pattern of this.EQUATION_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        equationCount += matches.length;
      }
    }
    if (equationCount > 2) {
      mathTypes.push('equations');
      totalMathChars += equationCount * 5; // Weight equations more heavily
    }
    
    // Calculate math score (ratio of math content)
    const textLength = text.length;
    const mathScore = textLength > 0 ? Math.min(1, totalMathChars / (textLength * 0.1)) : 0;
    
    // Check for extraction issues (garbled math indicates broken PDF extraction)
    const hasExtractionIssues = mathTypes.includes('garbled_math');
    
    // Clean the text
    const { cleanedText, cleanedCount } = this.clean(text);
    
    return {
      hasMath: mathScore > 0.05 || mathTypes.length >= 2,
      mathScore: Math.round(mathScore * 100) / 100,
      mathTypes,
      cleanedText,
      cleanedIssues: cleanedCount,
      hasExtractionIssues
    };
  }
  
  /**
   * Clean text of common extraction artifacts.
   * 
   * @param text - The text to clean
   * @returns Cleaned text and count of issues fixed
   */
  /**
   * Clean text of common extraction artifacts.
   * 
   * @param text - The text to clean
   * @param recoverMath - Whether to recover garbled math characters first (default: true)
   * @returns Cleaned text and count of issues fixed
   */
  clean(text: string, recoverMath: boolean = true): { cleanedText: string; cleanedCount: number } {
    let cleanedText = text;
    let cleanedCount = 0;
    
    // First, recover garbled math characters (broken surrogate pairs)
    if (recoverMath) {
      const garbledMatches = cleanedText.match(this.GARBLED_MATH_HANGUL);
      if (garbledMatches) {
        cleanedCount += garbledMatches.length;
        cleanedText = this.recoverGarbledMath(cleanedText);
      }
    }
    
    // Normalize Mathematical Alphanumeric Symbols to ASCII
    const mathAlphaMatches = cleanedText.match(this.MATH_ALPHANUMERIC);
    if (mathAlphaMatches) {
      cleanedCount += mathAlphaMatches.length;
      cleanedText = cleanedText.replace(this.MATH_ALPHANUMERIC, (char) => 
        this.normalizeMathAlphanumeric(char)
      );
    }
    
    // Replace ligatures
    for (const [ligature, replacement] of Object.entries(this.LIGATURE_MAP)) {
      const regex = new RegExp(ligature, 'g');
      const matches = cleanedText.match(regex);
      if (matches) {
        cleanedCount += matches.length;
        cleanedText = cleanedText.replace(regex, replacement);
      }
    }
    
    // Remove orphaned LaTeX commands (but preserve the content)
    const latexMatches = cleanedText.match(this.LATEX_COMMANDS);
    if (latexMatches) {
      cleanedCount += latexMatches.length;
      cleanedText = cleanedText.replace(this.LATEX_COMMANDS, (match) => {
        // Extract content from \command{content} -> content
        const contentMatch = match.match(/\{([^}]*)\}/);
        return contentMatch ? contentMatch[1] : '';
      });
    }
    
    // Normalize multiple spaces
    const multiSpaceMatches = cleanedText.match(/  +/g);
    if (multiSpaceMatches) {
      cleanedCount += multiSpaceMatches.length;
      cleanedText = cleanedText.replace(/  +/g, ' ');
    }
    
    // Normalize newlines (remove excessive)
    const multiNewlineMatches = cleanedText.match(/\n{3,}/g);
    if (multiNewlineMatches) {
      cleanedCount += multiNewlineMatches.length;
      cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
    }
    
    // Clean up space around punctuation
    cleanedText = cleanedText.replace(/\s+([.,;:!?)])/g, '$1');
    cleanedText = cleanedText.replace(/([([{])\s+/g, '$1');
    
    return { cleanedText: cleanedText.trim(), cleanedCount };
  }
  
  /**
   * Check if text has significant math content (quick check).
   */
  hasMathContent(text: string): boolean {
    // Quick check for common math indicators
    if (this.GREEK_LETTERS.test(text)) return true;
    if (this.MATH_ALPHANUMERIC.test(text)) return true;
    if (this.MATH_SYMBOLS.test(text)) return true;
    if (this.LATEX_COMMANDS.test(text)) return true;
    
    // Check for garbled math (Hangul in math context)
    const garbledMatches = text.match(this.GARBLED_MATH_HANGUL);
    if (garbledMatches && garbledMatches.length > 3) {
      if (/[\uD400-\uD7FF]\s*[=+\-*/0-9]|[0-9=+\-*/]\s*[\uD400-\uD7FF]/.test(text)) {
        return true;
      }
    }
    
    // Check equation patterns
    for (const pattern of this.EQUATION_PATTERNS) {
      const matches = text.match(pattern);
      if (matches && matches.length > 2) return true;
    }
    
    return false;
  }
  
  /**
   * Get a searchable version of text with Greek letters expanded
   * and math alphanumeric normalized.
   * Useful for improving search matching.
   */
  getSearchableText(text: string): string {
    let searchable = text;
    
    // First normalize mathematical alphanumeric to ASCII
    searchable = searchable.replace(this.MATH_ALPHANUMERIC, (char) => 
      this.normalizeMathAlphanumeric(char)
    );
    
    // Expand Greek letters to their names for better search matching
    for (const [greek, name] of Object.entries(this.GREEK_ASCII_MAP)) {
      searchable = searchable.replace(new RegExp(greek, 'g'), ` ${name} `);
    }
    
    // Clean up extra spaces
    searchable = searchable.replace(/\s+/g, ' ').trim();
    
    return searchable;
  }
}

/**
 * Singleton instance for convenience.
 */
export const mathContentHandler = new MathContentHandler();

/**
 * Convenience function for analysis.
 */
export function analyzeMathContent(text: string): MathAnalysisResult {
  return mathContentHandler.analyze(text);
}

/**
 * Convenience function for quick check.
 */
export function hasMathContent(text: string): boolean {
  return mathContentHandler.hasMathContent(text);
}

/**
 * Convenience function to recover garbled math from broken PDF extraction.
 */
export function recoverGarbledMath(text: string): string {
  return mathContentHandler.recoverGarbledMath(text);
}
