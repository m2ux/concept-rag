import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/__tests__/**',
        'scripts/',
        'hybrid_fast_seed.ts',
        'rebuild_concept_index_standalone.ts'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    },
    include: ['src/**/*.{test,spec,bench}.ts'],
    exclude: ['node_modules', 'dist', 'test'],
    testTimeout: 10000
  }
});

