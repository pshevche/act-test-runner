import { defineConfig } from 'lint-staged/config';

export default defineConfig({
  '*': [
    [
      'oxfmt --no-error-on-unmatched-pattern',
      'eslint --fix --no-error-on-unmatched-pattern --flag unstable_native_nodejs_ts_config',
    ],
  ],
  // https://github.com/lint-staged/lint-staged#workaround-use-a-function-signature-for-the-tsc-command
  '*.{ts,mts}': () => 'tsc --noEmit',
});
