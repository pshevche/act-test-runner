import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default defineConfig({
  files: ['**/*.ts', '**/*.tsx'],
  ignores: ['dist/**', 'node_modules/**'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    globals: {
      ...globals.node,
    },
  },
  plugins: {
    '@typescript-eslint': tseslint.plugin,
    prettier,
  },
  rules: {
    'no-unused-vars': 'off',
    'no-debugger': 'warn',
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
});
