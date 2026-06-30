import { describe, it, expect } from 'vitest';
import { BaseTool, ToolResponse } from '../tool.js';
import { ConceptNotFoundError } from '../../../domain/exceptions/index.js';

/**
 * Minimal concrete tool exposing the protected handleError for testing.
 */
class TestTool extends BaseTool {
  name = 'test';
  description = 'test tool';
  inputSchema = { type: 'object' as const, properties: {} };
  async execute(): Promise<ToolResponse> {
    return { content: [], isError: false };
  }
  handle(error: unknown): ToolResponse {
    return this.handleError(error);
  }
}

describe('BaseTool.handleError', () => {
  const tool = new TestTool();

  it('formats a data-integrity error as structured output (code, context, timestamp)', () => {
    // Data-integrity errors now extend ConceptRAGError, so the boundary emits
    // their structured form rather than a bare message.
    const response = tool.handle(new ConceptNotFoundError('machine-learning'));

    expect(response.isError).toBe(true);
    expect(response._meta?.errorCode).toBe('CONCEPT_NOT_FOUND');
    expect(response._meta?.errorName).toBe('ConceptNotFoundError');

    const payload = JSON.parse(response.content[0].text);
    expect(payload.error.code).toBe('CONCEPT_NOT_FOUND');
    expect(payload.error.context).toMatchObject({ conceptName: 'machine-learning' });
    expect(payload.error.timestamp).toBeDefined();
  });

  it('falls back to a plain message for non-ConceptRAGError errors', () => {
    const response = tool.handle(new Error('boom'));

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe('boom');
    expect(response._meta).toBeUndefined();
  });
});
