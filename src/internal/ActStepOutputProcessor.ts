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

import type { ActStepExecResult } from '../ActRunnerResult.js';

import { ActJobOrStepDescriptor } from '../ActOutputListener.js';
import { ActExecStatus } from '../ActRunnerResult.js';
import { formattedMessage, JsonOutput } from './ActJsonOutput.js';

export class ActStepExecResultBuilder {
  readonly descriptor: ActJobOrStepDescriptor;
  private status: ActExecStatus | undefined;
  private readonly outputLines: string[] = [];

  constructor(descriptor: ActJobOrStepDescriptor) {
    this.descriptor = descriptor;
  }

  processOutput(output: JsonOutput) {
    const msg = formattedMessage(output.msg, output.job);
    this.outputLines.push(msg);

    if (output.stepResult === 'failure') {
      this.status = ActExecStatus.FAILED;
    } else if (output.stepResult === 'skipped') {
      this.status = ActExecStatus.SKIPPED;
    } else if (output.stepResult !== undefined) {
      this.status = ActExecStatus.SUCCESS;
    }
  }

  buildResult(): ActStepExecResult {
    return {
      name: this.descriptor.name,
      status: this.status!,
      output: this.outputLines.join('\n'),
    };
  }
}
