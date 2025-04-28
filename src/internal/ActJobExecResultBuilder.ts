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

import { ActJobExecResult } from '../ActJobExecResult.js';
import { ActExecStatus } from '../ActExecStatus.js';

export class ActJobExecResultBuilder {
  private readonly name: string;
  private hasExecutedSteps: boolean = false;
  private status: ActExecStatus | undefined;
  private readonly outputLines: string[] = [];

  constructor(name: string) {
    this.name = name;
  }

  output(line: string): ActJobExecResultBuilder {
    this.outputLines.push(line);
    return this;
  }

  stepCompleted(): ActJobExecResultBuilder {
    this.hasExecutedSteps = true;
    return this;
  }

  completed(): ActJobExecResultBuilder {
    this.status = this.hasExecutedSteps
      ? ActExecStatus.SUCCESS
      : ActExecStatus.SKIPPED;
    return this;
  }

  failed(): ActJobExecResultBuilder {
    this.status = ActExecStatus.FAILED;
    return this;
  }

  build(): ActJobExecResult {
    return new ActJobExecResult(
      this.name,
      this.status!,
      this.outputLines.join('\n'),
    );
  }
}
