/**
 * Copyright (c) 2026 original authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** Matrix values a job ran with. */
export type ActMatrixValues = Record<string, string | number | boolean>;

/** Result of the workflow execution. */
export type ActWorkflowExecResult = {
  /** Outcome of the workflow run. */
  readonly status: ActExecStatus;
  /** Workflow's console output. */
  readonly output: string;
  /** Jobs executed by the workflow, keyed by job name. */
  readonly jobs: Record<string, ActJobExecResult>;
};

/** Outcome of the workflow or job execution. */
export const ActExecStatus = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;

/** Outcome of the workflow or job execution. */
export type ActExecStatus = (typeof ActExecStatus)[keyof typeof ActExecStatus];

/** Job execution result for inspection. */
export type ActJobExecResult = {
  /** Name of the job run. */
  readonly name: string;
  /** Result of the job execution. */
  readonly status: ActExecStatus;
  /** Job's console output. */
  readonly output: string;
  /** Matrix values the job ran with. */
  readonly matrix: ActMatrixValues;
  /** Steps executed by the job, in the order they ran. */
  readonly steps: ActStepExecResult[];
};

/** Step execution result for inspection. */
export type ActStepExecResult = {
  /** Name of the step run. */
  readonly name: string;
  /** Result of the step execution. */
  readonly status: ActExecStatus;
  /** Step's console output. */
  readonly output: string;
};

/**
 * Error thrown if the `ActRunner` is mis-configured or if the runner encounters
 * an unexpected error.
 */
export class ActRunnerError extends Error {}
