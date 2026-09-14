import { defineConfig } from 'lint-staged/config';

export default defineConfig({
  '*': [
    [
      'oxfmt --no-error-on-unmatched-pattern',
      'oxlint --fix --no-error-on-unmatched-pattern',
    ],
  ],
  // https://github.com/lint-staged/lint-staged#workaround-use-a-function-signature-for-the-tsc-command
  '*.{ts,mts}': () => 'tsc --noEmit',
});
