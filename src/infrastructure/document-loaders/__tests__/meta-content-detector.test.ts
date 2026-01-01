/**
 * Unit Tests for Meta Content Detector
 * 
 * Tests the detection of table of contents, front matter, and back matter.
 */

import { describe, it, expect } from 'vitest';
import { Document } from '@langchain/core/documents';
import { 
  MetaContentDetector, 
  analyzeMetaContent,
  markMetaContentChunks 
} from '../meta-content-detector.js';

// Helper to create mock chunks
function createMockChunks(chunks: Array<{ text: string; page: number }>): Document[] {
  return chunks.map((c, i) => new Document({
    pageContent: c.text,
    metadata: { source: 'test.pdf', page_number: c.page, chunkIndex: i }
  }));
}

describe('MetaContentDetector', () => {
  const detector = new MetaContentDetector();
  
  describe('Table of Contents Detection', () => {
    it('should detect ToC header "Contents"', () => {
      const text = `Contents

Chapter 1: Introduction.............1
Chapter 2: Methods..................15
Chapter 3: Results..................42`;
      
      const result = detector.analyze(text, 3, 100);
      
      expect(result.isToc).toBe(true);
      expect(result.isMetaContent).toBe(true);
      expect(result.matchedPatterns).toContain('toc_header');
    });
    
    it('should detect "Table of Contents" header', () => {
      const text = `Table of Contents

1. Introduction.....................1
2. Background......................10
3. Implementation..................25`;
      
      const result = detector.analyze(text, 2, 100);
      
      expect(result.isToc).toBe(true);
      expect(result.matchedPatterns).toContain('toc_header');
    });
    
    it('should detect dotted ToC entries without header', () => {
      const text = `Chapter 1: Getting Started.............1
Chapter 2: Core Concepts..............15
Chapter 3: Advanced Topics............45
Chapter 4: Best Practices.............78`;
      
      const result = detector.analyze(text, 5, 100);
      
      expect(result.isToc).toBe(true);
      expect(result.matchedPatterns).toContain('toc_high_density');
    });
    
    it('should detect numbered section ToC entries', () => {
      const text = `1.1 Overview.......................5
1.2 Architecture...................12
1.3 Components.....................18
2.1 Installation...................25
2.2 Configuration..................32`;
      
      const result = detector.analyze(text, 4, 100);
      
      expect(result.isToc).toBe(true);
    });
    
    it('should NOT detect regular content as ToC', () => {
      const text = `Dependency injection is a design pattern that implements 
inversion of control. It allows for loose coupling between classes 
and their dependencies. This chapter will explore various approaches 
to implementing dependency injection in modern applications.`;
      
      const result = detector.analyze(text, 50, 100);
      
      expect(result.isToc).toBe(false);
    });
    
    it('should NOT detect single page number mention as ToC', () => {
      const text = `As discussed in Chapter 5, the implementation of dependency 
injection requires careful consideration of the container lifecycle.
See page 42 for more details on this topic.`;
      
      const result = detector.analyze(text, 60, 100);
      
      expect(result.isToc).toBe(false);
    });
  });
  
  describe('Front Matter Detection', () => {
    it('should detect copyright page', () => {
      const text = `Copyright © 2024 by Author Name
All rights reserved.
ISBN 978-0-123456-78-9
First published 2024

No part of this book may be reproduced without permission.`;
      
      const result = detector.analyze(text, 2, 100);
      
      expect(result.isFrontMatter).toBe(true);
      expect(result.isMetaContent).toBe(true);
      expect(result.matchedPatterns).toContain('copyright_multiple');
    });
    
    it('should detect preface section', () => {
      const text = `Preface

This book grew out of years of teaching software architecture 
to graduate students and practicing engineers. The goal is to 
provide a practical guide that bridges theory and practice.`;
      
      const result = detector.analyze(text, 5, 100);
      
      expect(result.isFrontMatter).toBe(true);
      expect(result.matchedPatterns).toContain('front_matter_header');
    });
    
    it('should detect dedication page', () => {
      const text = `Dedication

For my wife, who understood when I said 
"I need to finish the chapter on dependency injection."`;
      
      const result = detector.analyze(text, 3, 100);
      
      expect(result.isFrontMatter).toBe(true);
    });
    
    it('should detect acknowledgments', () => {
      const text = `Acknowledgments

I would like to thank my editor, reviewers, and colleagues 
who provided invaluable feedback on this manuscript.`;
      
      const result = detector.analyze(text, 6, 100);
      
      expect(result.isFrontMatter).toBe(true);
    });
    
    it('should detect foreword', () => {
      const text = `Foreword

It gives me great pleasure to introduce this important work 
on software architecture. The author brings unique insights...`;
      
      const result = detector.analyze(text, 4, 100);
      
      expect(result.isFrontMatter).toBe(true);
    });
    
    it('should NOT detect content with "copyright" mention as front matter', () => {
      const text = `The concept of intellectual property and copyright law affects 
how we distribute software. Open source licenses provide an 
alternative to traditional copyright restrictions.`;
      
      const result = detector.analyze(text, 50, 100);
      
      // Single mention without other indicators should not trigger
      expect(result.isFrontMatter).toBe(false);
    });
  });
  
  describe('Back Matter Detection', () => {
    it('should detect index page', () => {
      const text = `Index

abstraction, 15-18, 42
architecture, 5, 23-25, 67
coupling, 12, 45
dependency injection, 33-40, 78
encapsulation, 8, 55`;
      
      const result = detector.analyze(text, 95, 100);
      
      expect(result.isBackMatter).toBe(true);
      expect(result.isMetaContent).toBe(true);
      expect(result.matchedPatterns).toContain('back_matter_header');
    });
    
    it('should detect glossary', () => {
      const text = `Glossary

Abstraction: The process of hiding implementation details.
API: Application Programming Interface.
Dependency: A component that another component relies on.`;
      
      const result = detector.analyze(text, 92, 100);
      
      expect(result.isBackMatter).toBe(true);
    });
    
    it('should detect appendix', () => {
      const text = `Appendix A

This appendix contains additional reference material and 
examples that supplement the main text.`;
      
      const result = detector.analyze(text, 88, 100);
      
      expect(result.isBackMatter).toBe(true);
    });
    
    it('should detect about the author', () => {
      const text = `About the Author

John Smith is a software architect with over 20 years of 
experience in enterprise systems. He currently works at...`;
      
      const result = detector.analyze(text, 98, 100);
      
      expect(result.isBackMatter).toBe(true);
    });
    
    it('should detect index entries by pattern even without header', () => {
      const text = `abstraction, 15-18, 42
architecture, 5, 23-25, 67
coupling, 12, 45
dependency injection, 33-40, 78
encapsulation, 8, 55
factory pattern, 22, 89
interface, 11, 44, 77`;
      
      const result = detector.analyze(text, 96, 100);
      
      expect(result.isBackMatter).toBe(true);
      expect(result.matchedPatterns).toContain('index_high_density');
    });
    
    it('should NOT detect regular content as back matter', () => {
      const text = `The appendix structure in software documentation serves to 
provide supplementary information. When discussing architecture, 
we often reference the glossary of terms to ensure clarity.`;
      
      const result = detector.analyze(text, 50, 100);
      
      expect(result.isBackMatter).toBe(false);
    });
  });
  
  describe('Aggregate isMetaContent', () => {
    it('should set isMetaContent true for ToC', () => {
      const text = `Contents\n\nChapter 1.............1`;
      const result = detector.analyze(text, 3, 100);
      
      expect(result.isMetaContent).toBe(true);
      expect(result.isToc).toBe(true);
    });
    
    it('should set isMetaContent true for front matter', () => {
      const text = `Copyright © 2024\nAll rights reserved.\nISBN 978-0-123456-78-9`;
      const result = detector.analyze(text, 2, 100);
      
      expect(result.isMetaContent).toBe(true);
      expect(result.isFrontMatter).toBe(true);
    });
    
    it('should set isMetaContent true for back matter', () => {
      const text = `Index\n\nterm, 42\nanother, 55`;
      const result = detector.analyze(text, 98, 100);
      
      expect(result.isMetaContent).toBe(true);
      expect(result.isBackMatter).toBe(true);
    });
    
    it('should set isMetaContent false for regular content', () => {
      const text = `This is regular chapter content discussing software patterns 
and best practices for building maintainable systems.`;
      const result = detector.analyze(text, 50, 100);
      
      expect(result.isMetaContent).toBe(false);
      expect(result.isToc).toBe(false);
      expect(result.isFrontMatter).toBe(false);
      expect(result.isBackMatter).toBe(false);
    });
  });
  
  describe('markMetaContentChunks', () => {
    it('should mark chunks with meta content metadata', () => {
      const chunks = createMockChunks([
        { text: 'Copyright © 2024\nAll rights reserved.\nISBN 978-0-123456-78-9', page: 2 },
        { text: 'Contents\n\nChapter 1.............1\nChapter 2.............10', page: 3 },
        { text: 'This is regular content about software architecture.', page: 50 },
        { text: 'Index\n\nterm, 42\nanother, 55-60', page: 98 }
      ]);
      
      detector.markMetaContentChunks(chunks, 100);
      
      // Front matter chunk
      expect(chunks[0].metadata.is_front_matter).toBe(true);
      expect(chunks[0].metadata.is_meta_content).toBe(true);
      
      // ToC chunk
      expect(chunks[1].metadata.is_toc).toBe(true);
      expect(chunks[1].metadata.is_meta_content).toBe(true);
      
      // Regular content
      expect(chunks[2].metadata.is_meta_content).toBe(false);
      
      // Back matter chunk
      expect(chunks[3].metadata.is_back_matter).toBe(true);
      expect(chunks[3].metadata.is_meta_content).toBe(true);
    });
  });
  
  describe('getStats', () => {
    it('should return correct statistics', () => {
      const chunks = createMockChunks([
        { text: 'Copyright © 2024\nISBN 978-0-123456-78-9', page: 2 },
        { text: 'Contents\n\nChapter 1.............1', page: 3 },
        { text: 'Regular content 1', page: 50 },
        { text: 'Regular content 2', page: 51 },
        { text: 'Index\n\nterm, 42', page: 98 }
      ]);
      
      detector.markMetaContentChunks(chunks, 100);
      const stats = detector.getStats(chunks);
      
      expect(stats.total).toBe(5);
      expect(stats.frontMatterChunks).toBe(1);
      expect(stats.tocChunks).toBe(1);
      expect(stats.backMatterChunks).toBe(1);
      expect(stats.metaContentChunks).toBe(3);
    });
  });
  
  describe('analyzeMetaContent convenience function', () => {
    it('should work like detector.analyze', () => {
      const text = `Contents\n\nChapter 1.............1`;
      const result = analyzeMetaContent(text, 3, 100);
      
      expect(result.isToc).toBe(true);
      expect(result.isMetaContent).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const result = detector.analyze('', 1, 100);
      
      expect(result.isMetaContent).toBe(false);
    });
    
    it('should handle text with only whitespace', () => {
      const result = detector.analyze('   \n\n   ', 1, 100);
      
      expect(result.isMetaContent).toBe(false);
    });
    
    it('should handle single page document', () => {
      const text = 'Short document content.';
      const result = detector.analyze(text, 1, 1);
      
      expect(result.isMetaContent).toBe(false);
    });
    
    it('should handle page number greater than total (edge case)', () => {
      const text = 'Some content';
      const result = detector.analyze(text, 150, 100);
      
      // Should not crash, position ratio > 1 treated as back
      expect(result).toBeDefined();
    });
  });
});

