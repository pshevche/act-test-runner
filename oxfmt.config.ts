import { defineConfig } from 'oxfmt';

export default defineConfig({
  $schema: './node_modules/oxfmt/configuration_schema.json',
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
