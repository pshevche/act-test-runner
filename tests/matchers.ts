import { expect } from 'vitest';
import { ActWorkflowExecResult } from '../src/ActWorkflowExecResult.js';
import { ActJobExecResult } from '../src/ActJobExecResult.js';
import { ActExecStatus } from '../src/ActExecStatus.js';

interface CustomMatchers<R = unknown> {
  toHaveStatus(expected: ActExecStatus): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
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
