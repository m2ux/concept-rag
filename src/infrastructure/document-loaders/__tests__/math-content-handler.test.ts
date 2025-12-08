/**
 * Unit Tests for Math Content Handler
 * 
 * Tests detection and cleaning of mathematical content.
 */

import { describe, it, expect } from 'vitest';
import { 
  MathContentHandler, 
  analyzeMathContent,
  hasMathContent,
  recoverGarbledMath
} from '../math-content-handler.js';

describe('MathContentHandler', () => {
  const handler = new MathContentHandler();
  
  describe('analyze', () => {
    describe('Greek letter detection', () => {
      it('should detect Greek letters', () => {
        const text = 'The value of α is approximately 0.05, and β = 0.95';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(true);
        expect(result.mathTypes).toContain('greek_letters');
      });
      
      it('should detect uppercase Greek letters', () => {
        const text = 'Let Σ denote the sum and Π the product';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(true);
        expect(result.mathTypes).toContain('greek_letters');
      });
    });
    
    describe('Math symbol detection', () => {
      it('should detect summation and integral symbols', () => {
        const text = 'The integral ∫ and sum ∑ are important';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(true);
        expect(result.mathTypes).toContain('math_symbols');
      });
      
      it('should detect comparison operators', () => {
        const text = 'Since x ≤ y and a ≥ b, we have x ≠ a';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(true);
        expect(result.mathTypes).toContain('math_symbols');
      });
      
      it('should detect infinity and approximation', () => {
        const text = 'As n → ∞, the value ≈ 1';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(true);
      });
    });
    
    describe('Subscript/superscript detection', () => {
      it('should detect subscript characters', () => {
        const text = 'The variables x₁, x₂, and x₃ are independent';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(true);
        expect(result.mathTypes).toContain('subscripts_superscripts');
      });
      
      it('should detect superscript characters', () => {
        const text = 'Calculate x² + y³ = z⁴';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(true);
        expect(result.mathTypes).toContain('subscripts_superscripts');
      });
    });
    
    describe('LaTeX command detection', () => {
      it('should detect leaked LaTeX commands', () => {
        const text = 'The equation \\frac{a}{b} shows the ratio';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(true);
        expect(result.mathTypes).toContain('latex_commands');
      });
      
      it('should detect LaTeX commands with content', () => {
        const text = 'Using \\textbf{bold} and \\alpha notation';
        const result = handler.analyze(text);
        
        expect(result.mathTypes).toContain('latex_commands');
      });
    });
    
    describe('Equation pattern detection', () => {
      it('should detect simple equations', () => {
        const text = 'Given x = 5 and y = 10, we find z = x + y';
        const result = handler.analyze(text);
        
        expect(result.mathTypes).toContain('equations');
      });
      
      it('should detect function notation', () => {
        const text = 'The function f(x) maps to g(y) which yields h(z)';
        const result = handler.analyze(text);
        
        expect(result.mathTypes).toContain('equations');
      });
      
      it('should detect statistical notation', () => {
        const text = 'We compute E[X] and Var(Y) along with P(A)';
        const result = handler.analyze(text);
        
        expect(result.mathTypes).toContain('equations');
      });
    });
    
    describe('Math score calculation', () => {
      it('should return low score for plain text', () => {
        const text = 'This is a simple paragraph about software engineering practices.';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(false);
        expect(result.mathScore).toBeLessThan(0.1);
      });
      
      it('should return higher score for math-heavy text', () => {
        const text = 'Let α = 0.05, β = 0.95. Given ∑xᵢ = n, compute E[X] where X ∼ N(μ, σ²)';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(true);
        expect(result.mathScore).toBeGreaterThan(0.1);
      });
    });
    
    describe('No math content', () => {
      it('should correctly identify text without math', () => {
        const text = 'The quick brown fox jumps over the lazy dog. This is a test sentence.';
        const result = handler.analyze(text);
        
        expect(result.hasMath).toBe(false);
        expect(result.mathTypes).toHaveLength(0);
      });
    });
    
    describe('Garbled math detection', () => {
      it('should detect garbled math characters in math context', () => {
        // Simulates broken surrogate pairs appearing as Hangul syllables
        // Pattern: Hangul chars mixed with numbers and operators
        const text = '푅 = 3푓+1 and 퐶 requires 2푓+1 replicas';
        const result = handler.analyze(text);
        
        expect(result.mathTypes).toContain('garbled_math');
        expect(result.hasExtractionIssues).toBe(true);
      });
      
      it('should not flag legitimate Korean text', () => {
        // Actual Korean text should not be flagged
        const text = '한국어 텍스트입니다. This is a mixed language document.';
        const result = handler.analyze(text);
        
        expect(result.mathTypes).not.toContain('garbled_math');
        expect(result.hasExtractionIssues).toBe(false);
      });
      
      it('should set hasExtractionIssues to false for clean math', () => {
        const text = 'Let α = 0.05 and β = 0.95';
        const result = handler.analyze(text);
        
        expect(result.hasExtractionIssues).toBe(false);
      });
    });
  });
  
  describe('clean', () => {
    it('should replace common ligatures', () => {
      const text = 'The \uFB01rst and \uFB02oor functions are ef\uFB01cient';
      const { cleanedText } = handler.clean(text);
      
      expect(cleanedText).toContain('first');
      expect(cleanedText).toContain('floor');
      expect(cleanedText).toContain('efficient');
      expect(cleanedText).not.toContain('\uFB01');
      expect(cleanedText).not.toContain('\uFB02');
    });
    
    it('should normalize smart quotes', () => {
      const text = '\u201CHello\u201D and \u2018world\u2019';
      const { cleanedText } = handler.clean(text);
      
      expect(cleanedText).toBe('"Hello" and \'world\'');
    });
    
    it('should normalize dashes', () => {
      const text = 'This \u2013 and this \u2014 are dashes';
      const { cleanedText } = handler.clean(text);
      
      expect(cleanedText).toBe('This - and this -- are dashes');
    });
    
    it('should remove orphaned LaTeX commands', () => {
      const text = 'The value \\alpha and \\beta{value} here';
      const { cleanedText } = handler.clean(text);
      
      expect(cleanedText).toBe('The value and value here');
      expect(cleanedText).not.toContain('\\');
    });
    
    it('should preserve LaTeX command content', () => {
      const text = 'Text with \\textbf{bold content} inside';
      const { cleanedText } = handler.clean(text);
      
      expect(cleanedText).toContain('bold content');
    });
    
    it('should normalize multiple spaces', () => {
      const text = 'Words   with    multiple     spaces';
      const { cleanedText } = handler.clean(text);
      
      expect(cleanedText).toBe('Words with multiple spaces');
    });
    
    it('should normalize excessive newlines', () => {
      const text = 'Paragraph one\n\n\n\n\nParagraph two';
      const { cleanedText } = handler.clean(text);
      
      expect(cleanedText).toBe('Paragraph one\n\nParagraph two');
    });
    
    it('should clean space around punctuation', () => {
      const text = 'Hello , world . How are you ?';
      const { cleanedText } = handler.clean(text);
      
      expect(cleanedText).toBe('Hello, world. How are you?');
    });
    
    it('should count cleaned issues', () => {
      const text = 'The  \uFB01rst  \u201Ctest\u201D  with \\alpha here';
      const { cleanedCount } = handler.clean(text);
      
      expect(cleanedCount).toBeGreaterThan(0);
    });
  });
  
  describe('hasMathContent', () => {
    it('should return true for Greek letters', () => {
      expect(handler.hasMathContent('α β γ')).toBe(true);
    });
    
    it('should return true for math symbols', () => {
      expect(handler.hasMathContent('∑ ∫ ∂')).toBe(true);
    });
    
    it('should return true for LaTeX commands', () => {
      expect(handler.hasMathContent('\\frac{a}{b}')).toBe(true);
    });
    
    it('should return false for plain text', () => {
      expect(handler.hasMathContent('Hello world')).toBe(false);
    });
    
    it('should return true for multiple equations', () => {
      expect(handler.hasMathContent('x = 5, y = 10, z = 15')).toBe(true);
    });
  });
  
  describe('getSearchableText', () => {
    it('should expand Greek letters to names', () => {
      const text = 'The value of α is related to β';
      const searchable = handler.getSearchableText(text);
      
      expect(searchable).toContain('alpha');
      expect(searchable).toContain('beta');
    });
    
    it('should preserve non-Greek text', () => {
      const text = 'Regular text without Greek';
      const searchable = handler.getSearchableText(text);
      
      expect(searchable).toBe('Regular text without Greek');
    });
    
    it('should handle mixed content', () => {
      const text = 'Set λ = 0.5 and compute';
      const searchable = handler.getSearchableText(text);
      
      expect(searchable).toContain('lambda');
      expect(searchable).toContain('0.5');
      expect(searchable).toContain('compute');
    });
  });
  
  describe('convenience functions', () => {
    it('analyzeMathContent should work', () => {
      const result = analyzeMathContent('α + β = γ');
      
      expect(result.hasMath).toBe(true);
      expect(result.mathTypes).toContain('greek_letters');
    });
    
    it('hasMathContent should work', () => {
      expect(hasMathContent('∑ x')).toBe(true);
      expect(hasMathContent('hello')).toBe(false);
    });
    
    it('recoverGarbledMath should work', () => {
      // 푓 (U+D453) should recover to 𝑓 (U+1D453)
      const garbled = '3푓+1';
      const recovered = recoverGarbledMath(garbled);
      
      expect(recovered).toBe('3𝑓+1');
    });
  });
  
  describe('recoverGarbledMath', () => {
    it('should recover garbled mathematical italic letters', () => {
      // These are Hangul syllables that should be Math Italic
      const garbled = '푅 = 푁 + 푓';  // R = N + f
      const recovered = handler.recoverGarbledMath(garbled);
      
      // Should recover to Mathematical Italic characters
      expect(recovered).toBe('𝑅 = 𝑁 + 𝑓');
      expect(recovered.codePointAt(0)).toBe(0x1D445); // Math Italic R
    });
    
    it('should recover garbled Greek letters', () => {
      // 훼 (U+D6FC) should become 𝛼 (U+1D6FC - Math Bold Alpha)
      const garbled = '훼 and 훽';
      const recovered = handler.recoverGarbledMath(garbled);
      
      expect(recovered.codePointAt(0)).toBe(0x1D6FC);
    });
    
    it('should preserve non-garbled text', () => {
      const text = 'Normal text without garbled chars';
      const recovered = handler.recoverGarbledMath(text);
      
      expect(recovered).toBe(text);
    });
    
    it('should handle mixed content', () => {
      const garbled = 'System requires 3푓+1 replicas where 푁 is size';
      const recovered = handler.recoverGarbledMath(garbled);
      
      expect(recovered).toContain('3𝑓+1');
      expect(recovered).toContain('𝑁');
      expect(recovered).toContain('System requires');
      expect(recovered).toContain('replicas where');
    });
  });
  
  describe('clean with recovery', () => {
    it('should recover and normalize math by default', () => {
      const garbled = '푓 = 5';
      const { cleanedText } = handler.clean(garbled);
      
      // Should recover to Math Italic f, then normalize to ASCII 'f'
      expect(cleanedText).toBe('f = 5');
    });
    
    it('should skip recovery when disabled', () => {
      const garbled = '푓 = 5';
      const { cleanedText } = handler.clean(garbled, false);
      
      // Should not recover, garbled char remains
      expect(cleanedText).toBe('푓 = 5');
    });
  });
});
