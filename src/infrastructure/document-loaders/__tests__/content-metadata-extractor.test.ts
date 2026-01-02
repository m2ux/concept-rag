/**
 * Unit Tests for Content Metadata Extractor
 *
 * Tests pattern-based extraction of bibliographic metadata from document content.
 */

import { describe, it, expect } from "vitest";
import {
  ContentMetadataExtractor,
  extractContentMetadata,
  ChunkData,
} from "../content-metadata-extractor.js";

// Helper to create mock chunks
function createChunk(text: string, pageNumber: number = 1): ChunkData {
  return {
    text,
    page_number: pageNumber,
    is_reference: false,
  };
}

describe("ContentMetadataExtractor", () => {
  const extractor = new ContentMetadataExtractor();

  describe("extract - author patterns", () => {
    it('should extract author from "Copyright © YYYY by Author Name"', async () => {
      const chunks = [
        createChunk("Copyright © 2018 by John K. Ousterhout.", 3),
      ];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("John K. Ousterhout");
      expect(result.confidence.author).toBeGreaterThanOrEqual(0.9);
    });

    it('should extract author from "Copyright © YYYY Author Name" (no "by")', async () => {
      const chunks = [createChunk("Copyright © 2020 Robert C. Martin", 2)];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("Robert C. Martin");
      expect(result.confidence.author).toBeGreaterThanOrEqual(0.9);
    });

    it('should extract author from "by Author Name" at line start', async () => {
      const chunks = [
        createChunk("A Philosophy of Software Design\nby John Ousterhout", 2),
      ];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("John Ousterhout");
      expect(result.confidence.author).toBeGreaterThanOrEqual(0.85);
    });

    it('should extract author from "by Author Name" inline', async () => {
      const chunks = [
        createChunk("Some book title by Martin Fowler and others.", 1),
      ];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("Martin Fowler");
      expect(result.confidence.author).toBeGreaterThanOrEqual(0.8);
    });

    it('should extract author from "Author: Name" field', async () => {
      const chunks = [createChunk("Title: Some Book\nAuthor: Kent Beck", 1)];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("Kent Beck");
      expect(result.confidence.author).toBeGreaterThanOrEqual(0.85);
    });

    it('should extract author from "Written by Name"', async () => {
      const chunks = [
        createChunk("This book was written by Eric Evans in 2003.", 1),
      ];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("Eric Evans");
      expect(result.confidence.author).toBeGreaterThanOrEqual(0.8);
    });

    it("should handle hyphenated author names", async () => {
      const chunks = [
        createChunk("Copyright © 2019 by Mary Smith-Jones.", 2),
      ];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("Mary Smith-Jones");
    });

    it("should reject single-word author names", async () => {
      const chunks = [createChunk("by Anonymous", 1)];

      const result = await extractor.extract(chunks);

      expect(result.author).toBeUndefined();
    });

    it("should reject overly long author strings", async () => {
      const chunks = [
        createChunk(
          "by John Smith and all the other contributors who helped make this book possible including the reviewers",
          1
        ),
      ];

      const result = await extractor.extract(chunks);

      // Should not extract the entire long string
      expect(result.author?.length || 0).toBeLessThan(60);
    });
  });

  describe("extract - year patterns", () => {
    it('should extract year from "Copyright © YYYY"', async () => {
      const chunks = [
        createChunk("Copyright © 2018 John K. Ousterhout.", 3),
      ];

      const result = await extractor.extract(chunks);

      expect(result.year).toBe(2018);
      expect(result.confidence.year).toBeGreaterThanOrEqual(0.9);
    });

    it('should extract year from "© YYYY"', async () => {
      const chunks = [createChunk("© 2021 All rights reserved", 2)];

      const result = await extractor.extract(chunks);

      expect(result.year).toBe(2021);
      expect(result.confidence.year).toBeGreaterThanOrEqual(0.9);
    });

    it('should extract year from "Copyright YYYY"', async () => {
      const chunks = [createChunk("Copyright 2015 by the author", 2)];

      const result = await extractor.extract(chunks);

      expect(result.year).toBe(2015);
      expect(result.confidence.year).toBeGreaterThanOrEqual(0.9);
    });

    it('should extract year from "First published YYYY"', async () => {
      const chunks = [createChunk("First published 1999 in the UK.", 3)];

      const result = await extractor.extract(chunks);

      expect(result.year).toBe(1999);
      expect(result.confidence.year).toBeGreaterThanOrEqual(0.85);
    });

    it('should extract year from "Published in YYYY"', async () => {
      const chunks = [createChunk("Published in 2007 by Acme Publishing", 2)];

      const result = await extractor.extract(chunks);

      expect(result.year).toBe(2007);
      expect(result.confidence.year).toBeGreaterThanOrEqual(0.85);
    });

    it('should extract year from "YYYY Edition"', async () => {
      const chunks = [createChunk("2020 Edition - Revised and Updated", 1)];

      const result = await extractor.extract(chunks);

      expect(result.year).toBe(2020);
      expect(result.confidence.year).toBeGreaterThanOrEqual(0.8);
    });

    it("should prefer copyright year over standalone years", async () => {
      const chunks = [
        createChunk(
          "Chapter 1: Events of 1984\nCopyright © 2020 by Author",
          1
        ),
      ];

      const result = await extractor.extract(chunks);

      expect(result.year).toBe(2020);
    });

    it("should reject invalid years", async () => {
      const chunks = [createChunk("Copyright © 1850 - too old", 1)];

      const result = await extractor.extract(chunks);

      expect(result.year).toBeUndefined();
    });

    it("should reject future years beyond next year", async () => {
      const chunks = [createChunk("Copyright © 2099 - too far", 1)];

      const result = await extractor.extract(chunks);

      expect(result.year).toBeUndefined();
    });
  });

  describe("extract - publisher patterns", () => {
    it('should extract publisher from "Published by Name"', async () => {
      const chunks = [
        createChunk("Published by Yaknyam Press, Palo Alto, CA.", 3),
      ];

      const result = await extractor.extract(chunks);

      // Pattern stops at comma - extracts just the publisher name
      expect(result.publisher).toBe("Yaknyam Press");
      expect(result.confidence.publisher).toBeGreaterThanOrEqual(0.9);
    });

    it('should extract publisher from "Publisher: Name"', async () => {
      const chunks = [createChunk("Publisher: Cambridge University Press", 2)];

      const result = await extractor.extract(chunks);

      expect(result.publisher).toContain("Cambridge University Press");
      expect(result.confidence.publisher).toBeGreaterThanOrEqual(0.85);
    });

    it("should recognize well-known publishers", async () => {
      const chunks = [
        createChunk(
          "Available from O'Reilly Media and other booksellers.",
          2
        ),
      ];

      const result = await extractor.extract(chunks);

      expect(result.publisher).toBe("O'Reilly Media");
      expect(result.confidence.publisher).toBeGreaterThanOrEqual(0.85);
    });

    it("should recognize Addison-Wesley", async () => {
      const chunks = [
        createChunk("Addison-Wesley Professional Development Series", 1),
      ];

      const result = await extractor.extract(chunks);

      expect(result.publisher).toBe("Addison-Wesley");
    });

    it("should recognize Pearson", async () => {
      const chunks = [
        createChunk("Pearson Education publishes this title.", 2),
      ];

      const result = await extractor.extract(chunks);

      expect(result.publisher).toBe("Pearson");
    });

    it("should recognize Manning", async () => {
      const chunks = [createChunk("MEAP v01: Manning Early Access Program", 2)];

      const result = await extractor.extract(chunks);

      expect(result.publisher).toBe("Manning");
    });

    it("should recognize No Starch Press", async () => {
      const chunks = [
        createChunk("Published by No Starch Press in San Francisco", 2),
      ];

      const result = await extractor.extract(chunks);

      expect(result.publisher).toContain("No Starch Press");
    });
  });

  describe("extract - title patterns", () => {
    it('should extract title from "Title: Name"', async () => {
      const chunks = [
        createChunk("Title: Domain-Driven Design\nAuthor: Eric Evans", 1),
      ];

      const result = await extractor.extract(chunks);

      expect(result.title).toBe("Domain-Driven Design");
      expect(result.confidence.title).toBeGreaterThanOrEqual(0.85);
    });

    it('should extract title from line before "by Author"', async () => {
      const chunks = [
        createChunk("Clean Architecture\nby Robert C. Martin", 1),
      ];

      const result = await extractor.extract(chunks);

      expect(result.title).toBe("Clean Architecture");
      expect(result.confidence.title).toBeGreaterThanOrEqual(0.8);
    });

    it("should reject titles that are just numbers", async () => {
      const chunks = [createChunk("Title: 12345", 1)];

      const result = await extractor.extract(chunks);

      expect(result.title).toBeUndefined();
    });
  });

  describe("extract - combined extraction", () => {
    it("should extract all metadata from typical copyright page", async () => {
      const chunks = [
        createChunk(
          `A Philosophy of Software Design
by John Ousterhout
Copyright © 2018 John K. Ousterhout.
All rights reserved.
Published by Yaknyam Press, Palo Alto, CA.
ISBN 978-1-7321022-0-0`,
          3
        ),
      ];

      const result = await extractor.extract(chunks);

      // Note: Pattern captures "John K Ousterhout" from copyright line
      expect(result.author).toContain("Ousterhout");
      expect(result.year).toBe(2018);
      expect(result.publisher).toBe("Yaknyam Press");
      expect(result.title).toBe("A Philosophy of Software Design");
    });

    it("should handle multiple chunks from different pages", async () => {
      const chunks = [
        createChunk("TITLE PAGE\nDomain-Driven Design\nby Eric Evans", 1),
        createChunk("Copyright © 2003 Eric Evans. All rights reserved.", 2),
        createChunk("Published by Addison-Wesley Professional.", 3),
      ];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("Eric Evans");
      expect(result.year).toBe(2003);
      expect(result.publisher).toBe("Addison-Wesley");
    });

    it("should skip reference chunks", async () => {
      const chunks: ChunkData[] = [
        { text: "Copyright © 2020 by Real Author", page_number: 2, is_reference: false },
        { text: "by Citation Author (2019)", page_number: 50, is_reference: true },
      ];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("Real Author");
    });

    it("should prefer earlier pages for metadata", async () => {
      const chunks = [
        createChunk("Copyright © 2015 by First Author. All rights reserved.", 2),
        createChunk("Copyright © 2020 by Later Author. All rights reserved.", 8),
      ];

      const result = await extractor.extract(chunks);

      // Should find the first copyright (page 2)
      expect(result.year).toBe(2015);
      expect(result.author).toBe("First Author");
    });
  });

  describe("extract - edge cases", () => {
    it("should handle empty chunks array", async () => {
      const result = await extractor.extract([]);

      expect(result.author).toBeUndefined();
      expect(result.year).toBeUndefined();
      expect(result.publisher).toBeUndefined();
      expect(result.confidence.author).toBe(0);
      expect(result.confidence.year).toBe(0);
      expect(result.confidence.publisher).toBe(0);
    });

    it("should handle chunks with no extractable metadata", async () => {
      const chunks = [
        createChunk("Chapter 1: Introduction\nThis is some content.", 1),
        createChunk("More content without metadata.", 2),
      ];

      const result = await extractor.extract(chunks);

      expect(result.author).toBeUndefined();
      expect(result.year).toBeUndefined();
      expect(result.publisher).toBeUndefined();
    });

    it("should handle chunks with undefined page numbers", async () => {
      const chunks: ChunkData[] = [
        { text: "Copyright © 2021 by Test Author", page_number: undefined },
      ];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("Test Author");
      expect(result.year).toBe(2021);
    });

    it("should skip chunks from pages > 10", async () => {
      const chunks = [
        createChunk("Copyright © 2021 by Late Author", 15),
      ];

      const result = await extractor.extract(chunks);

      // Should not find metadata from page 15
      expect(result.author).toBeUndefined();
    });
  });

  describe("convenience function", () => {
    it("extractContentMetadata should work", async () => {
      const chunks = [
        createChunk("Copyright © 2020 by Test Author", 2),
      ];

      const result = await extractContentMetadata(chunks);

      expect(result.author).toBe("Test Author");
      expect(result.year).toBe(2020);
    });
  });

  describe("author name cleaning", () => {
    it("should remove trailing punctuation", async () => {
      const chunks = [createChunk("by John Smith.", 1)];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("John Smith");
    });

    it("should remove PhD suffix", async () => {
      const chunks = [createChunk("by John Smith Ph.D.", 1)];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("John Smith");
    });

    it("should normalize whitespace", async () => {
      const chunks = [createChunk("by  John   Smith", 1)];

      const result = await extractor.extract(chunks);

      expect(result.author).toBe("John Smith");
    });
  });
});

