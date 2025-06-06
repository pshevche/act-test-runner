/**
 * Copyright (c) 2025 original authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { ActExecStatus } from './ActExecStatus.js';
import { ActJobExecResult } from './ActJobExecResult.js';

/**
 * Result of the workflow execution.
 */
export class ActWorkflowExecResult {
  /**
   * Outcome of the workflow run.
   */
  readonly status: ActExecStatus;
  /**
   * Workflow's console output.
   */
  readonly output: string;
  /**
   * Jobs executed by the workflow.
   */
  readonly jobs: Map<String, ActJobExecResult>;

  constructor(
    status: ActExecStatus,
    output: string,
    jobs: Map<String, ActJobExecResult>,
  ) {
    this.status = status;
    this.output = output;
    this.jobs = jobs;
  }

  /**
   * @param name - name of the job executed by the given workflow.
   * @returns job - result of executing the given job in the context of the current workflow.
   */
  job(name: string): ActJobExecResult | undefined {
    return this.jobs.get(name);
  }
}
