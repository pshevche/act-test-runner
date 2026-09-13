import { expect } from 'vitest';

import {
  ActExecStatus,
  ActJobExecResult,
  ActWorkflowExecResult,
} from '../src/ActRunnerResult.js';

interface CustomMatchers<R = unknown> {
  toHaveStatus(expected: ActExecStatus): R;
}

declare module 'vitest' {
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required to match vitest's Matchers type parameter list
    T = unknown,
  > extends CustomMatchers<R> {}
}

expect.extend({
  toHaveStatus(
    result: ActWorkflowExecResult | ActJobExecResult,
    expected: ActExecStatus,
  ) {
    const pass = result.status == expected;
    return {
      pass,
      message: () =>
        pass
          ? `expected exec result not to be ${expected}.\nOutput:\n${result.output}`
          : `expected exec result to be ${expected}, but got ${result.status}.\nOutput:\n${result.output}`,
    };
  },
});
