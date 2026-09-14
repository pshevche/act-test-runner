import { defineConfig } from 'oxfmt';

export default defineConfig({
  $schema: './node_modules/oxfmt/configuration_schema.json',
  // As of now Oxfmt doesn't support range ignore comments
  // https://github.com/oxc-project/oxc/issues/18148
  // So, to prevent oxfmt to format code blocks in comments,
  // temporarily adding zod.ts file to the ignore list as
  // a workaround.
  ignorePatterns: ['src/utils/zod.ts'],
  arrowParens: 'always',
  jsdoc: true,
  printWidth: 80,
  singleQuote: true,
  sortImports: {
    groups: [
      'type-import',
      ['value-builtin', 'value-external'],
      'type-internal',
      'value-internal',
      ['type-parent', 'type-sibling', 'type-index'],
      ['value-parent', 'value-sibling', 'value-index'],
      'unknown',
    ],
    newlinesBetween: true,
  },
  sortPackageJson: false,
  trailingComma: 'all',
});
