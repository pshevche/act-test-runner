import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const tsVersion = process.env.TS_VERSION || 'typescript';

// Get 'typescript' executable from `TS_VERSION` env variable
const tsModulePath =
  tsVersion === 'typescript'
    ? 'typescript'
    : resolve(import.meta.dirname, `node_modules/${tsVersion}`);

export default defineConfig({
  test: {
    clearMocks: true,
    fileParallelism: false,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    testTimeout: 50_000,
    globalSetup: './vitest.global.setup.ts',
  },
  resolve: {
    // Force Vite to alias any internal imports of 'typescript'
    // to the specific version we are currently testing against!
    alias: {
      typescript: tsModulePath,
    },
  },
});
