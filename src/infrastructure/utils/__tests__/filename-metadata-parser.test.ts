/**
 * Unit Tests for Filename Metadata Parser
 * 
 * Tests the parsing of bibliographic metadata from filenames using the '--' delimiter format.
 */

import { describe, it, expect } from 'vitest';
import { parseFilenameMetadata, normalizeText, FilenameMetadata } from '../filename-metadata-parser.js';

describe('normalizeText', () => {
    it('should convert underscores to spaces', () => {
        expect(normalizeText('Hello_World')).toBe('Hello World');
        expect(normalizeText('foo_bar_baz')).toBe('foo bar baz');
    });

    it('should convert URL-encoded spaces (%20) to spaces', () => {
        expect(normalizeText('Hello%20World')).toBe('Hello World');
        expect(normalizeText('foo%20bar%20baz')).toBe('foo bar baz');
    });

    it('should convert _20 encoding to spaces', () => {
        expect(normalizeText('Hello_20World')).toBe('Hello World');
        expect(normalizeText('foo_20bar_20baz')).toBe('foo bar baz');
    });

    it('should normalize multiple spaces to single space', () => {
        expect(normalizeText('Hello    World')).toBe('Hello World');
        expect(normalizeText('foo  bar   baz')).toBe('foo bar baz');
    });

    it('should trim leading and trailing whitespace', () => {
        expect(normalizeText('  Hello World  ')).toBe('Hello World');
        expect(normalizeText('\t  foo bar  \n')).toBe('foo bar');
    });

    it('should handle combined cases', () => {
        expect(normalizeText('Hello_World%20Test_20Case')).toBe('Hello World Test Case');
        expect(normalizeText('  _foo__bar_  ')).toBe('foo bar');
    });

    it('should handle empty string', () => {
        expect(normalizeText('')).toBe('');
    });
});

describe('parseFilenameMetadata', () => {
    describe('full format parsing', () => {
        it('should parse all fields from complete filename', () => {
            const path = '/home/user/docs/Effective software testing -- Elfriede Dustin -- December 18, 2002 -- Addison-Wesley Professional -- 9780201794298 -- 5297d243816c0cae20024a3504eaabf0.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('Effective software testing');
            expect(result.author).toBe('Elfriede Dustin');
            expect(result.year).toBe(2002);
            expect(result.publisher).toBe('Addison-Wesley Professional');
            expect(result.isbn).toBe('9780201794298');
        });

        it('should parse filename with underscores in title', () => {
            const path = '/docs/Clean_Architecture_A_Craftsmans_Guide -- Robert C. Martin -- 2017 -- Pearson -- 9780134494166 -- abc123.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('Clean Architecture A Craftsmans Guide');
            expect(result.author).toBe('Robert C. Martin');
            expect(result.year).toBe(2017);
        });

        it('should parse filename with %20 encoding', () => {
            const path = '/docs/Design%20Patterns -- Gang%20of%20Four -- 1994 -- Addison-Wesley -- 0201633612 -- hash.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('Design Patterns');
            expect(result.author).toBe('Gang of Four');
            expect(result.year).toBe(1994);
        });

        it('should parse filename with _20 encoding', () => {
            const path = '/docs/The_20Pragmatic_20Programmer -- David Thomas -- 2019 -- Addison-Wesley -- 9780135957059 -- hash.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('The Pragmatic Programmer');
            expect(result.author).toBe('David Thomas');
        });
    });

    describe('partial format handling', () => {
        it('should handle filename with only title', () => {
            const path = '/docs/Simple Title.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('Simple Title');
            expect(result.author).toBe('');
            expect(result.year).toBe(0);
            expect(result.publisher).toBe('');
            expect(result.isbn).toBe('');
        });

        it('should handle filename with title and author only', () => {
            const path = '/docs/Book Title -- Author Name.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('Book Title');
            expect(result.author).toBe('Author Name');
            expect(result.year).toBe(0);
        });

        it('should handle filename with title, author, and date', () => {
            const path = '/docs/My Book -- John Doe -- March 2020.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('My Book');
            expect(result.author).toBe('John Doe');
            expect(result.year).toBe(2020);
            expect(result.publisher).toBe('');
        });

        it('should handle missing middle fields gracefully', () => {
            // With 6 parts: Title, Author, (empty), Publisher, ISBN, hash
            // Note: double space between -- and -- to create empty element when split by " -- "
            const path = '/docs/Title -- Author --  -- Publisher -- 9781234567890 -- hash.epub';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('Title');
            expect(result.author).toBe('Author');
            expect(result.year).toBe(0);  // Empty date field at position 2
            expect(result.publisher).toBe('Publisher');  // Position 3
            expect(result.isbn).toBe('9781234567890');   // Position 4
        });
        
        it('should handle completely missing fields (fewer parts)', () => {
            // When fields are missing entirely (fewer parts), fields stay empty
            const path = '/docs/Title -- Author.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('Title');
            expect(result.author).toBe('Author');
            expect(result.year).toBe(0);
            expect(result.publisher).toBe('');
            expect(result.isbn).toBe('');
        });
        
        it('should use whole filename as title when no delimiters present', () => {
            const path = '/docs/Simple Document Name.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('Simple Document Name');
            expect(result.author).toBe('');
            expect(result.year).toBe(0);
            expect(result.publisher).toBe('');
            expect(result.isbn).toBe('');
        });
        
        it('should normalize whole filename when no delimiters present', () => {
            const path = '/docs/My_Document_With_Underscores.pdf';
            const result = parseFilenameMetadata(path);
            
            expect(result.title).toBe('My Document With Underscores');
        });
    });

    describe('year extraction', () => {
        it('should extract year from full date string', () => {
            const path = '/docs/Book -- Author -- December 18, 2002 -- Publisher -- ISBN -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.year).toBe(2002);
        });

        it('should extract year from partial date string', () => {
            const path = '/docs/Book -- Author -- 2019 -- Publisher -- ISBN -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.year).toBe(2019);
        });

        it('should extract year from "Month YYYY" format', () => {
            const path = '/docs/Book -- Author -- January 2015 -- Publisher -- ISBN -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.year).toBe(2015);
        });

        it('should handle years from 1900s and 2000s', () => {
            expect(parseFilenameMetadata('/docs/Old Book -- Author -- 1995 -- P -- I -- h.pdf').year).toBe(1995);
            expect(parseFilenameMetadata('/docs/New Book -- Author -- 2023 -- P -- I -- h.pdf').year).toBe(2023);
        });

        it('should return 0 for invalid date field', () => {
            const path = '/docs/Book -- Author -- No Date Here -- Publisher -- ISBN -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.year).toBe(0);
        });
    });

    describe('ISBN validation', () => {
        it('should accept valid 10-digit ISBN', () => {
            const path = '/docs/Book -- Author -- 2000 -- Publisher -- 0201633612 -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.isbn).toBe('0201633612');
        });

        it('should accept valid 13-digit ISBN', () => {
            const path = '/docs/Book -- Author -- 2000 -- Publisher -- 9780201633610 -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.isbn).toBe('9780201633610');
        });

        it('should accept ISBN with hyphens', () => {
            const path = '/docs/Book -- Author -- 2000 -- Publisher -- 978-0-201-63361-0 -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.isbn).toBe('978-0-201-63361-0');
        });

        it('should reject invalid ISBN (wrong length)', () => {
            const path = '/docs/Book -- Author -- 2000 -- Publisher -- 12345 -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.isbn).toBe('');
        });

        it('should reject hash mistaken as ISBN', () => {
            const path = '/docs/Book -- Author -- 2000 -- Publisher -- 5297d243816c0cae20024a3504eaabf0 -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.isbn).toBe('');  // Too long, not numeric
        });
    });

    describe('edge cases', () => {
        it('should handle empty path', () => {
            const result = parseFilenameMetadata('');
            expect(result.title).toBe('');
            expect(result.author).toBe('');
        });

        it('should handle path with no extension', () => {
            const path = '/docs/Book Title -- Author Name';
            const result = parseFilenameMetadata(path);
            expect(result.title).toBe('Book Title');
            expect(result.author).toBe('Author Name');
        });

        it('should handle filename with multiple dots', () => {
            const path = '/docs/Dr. Smith - A Study -- Dr. John Smith -- 2020 -- Press -- ISBN -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.title).toBe('Dr. Smith - A Study');
            expect(result.author).toBe('Dr. John Smith');
        });

        it('should handle EPUB files', () => {
            const path = '/docs/Title -- Author -- 2021 -- Publisher -- 9781234567890 -- hash.epub';
            const result = parseFilenameMetadata(path);
            expect(result.title).toBe('Title');
            expect(result.isbn).toBe('9781234567890');
        });

        it('should handle Windows-style paths (on Windows)', () => {
            // Note: path.basename on Linux doesn't recognize Windows backslash separators
            // On Windows this would work correctly, on Linux the whole path is treated as filename
            // This test verifies it doesn't crash and extracts what it can
            const winPath = 'C:\\Users\\docs\\Title -- Author -- 2020 -- Pub -- 1234567890 -- hash.pdf';
            const result = parseFilenameMetadata(winPath);
            // On Linux: title will include the path prefix, author should still parse
            expect(result.author).toBe('Author');
            expect(result.year).toBe(2020);
        });

        it('should handle special characters in title', () => {
            const path = '/docs/C++ Programming (3rd Ed.) -- Bjarne -- 2013 -- A-W -- 9780321958327 -- hash.pdf';
            const result = parseFilenameMetadata(path);
            expect(result.title).toBe('C++ Programming (3rd Ed.)');
        });
    });
});

