/**
 * Copyright (c) 2026 original authors
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

import { ActExecStatus } from '../ActRunnerResult.js';
import type { ActJobExecResult, ActMatrixValues } from '../ActRunnerResult.js';
import { ActStepExecResultBuilder } from './ActStepExecResultBuilder.js';

export class ActJobExecResultBuilder {
  private readonly name: string;
  private readonly matrix: ActMatrixValues;
  private hasExecutedSteps: boolean = false;
  private status: ActExecStatus | undefined;
  private readonly outputLines: string[] = [];
  private readonly stepsById: Map<string, ActStepExecResultBuilder> = new Map<
    string,
    ActStepExecResultBuilder
  >();

  constructor(name: string, matrix: ActMatrixValues) {
    this.name = name;
    this.matrix = matrix;
  }

  output(line: string): ActJobExecResultBuilder {
    this.outputLines.push(line);
    return this;
  }

  step(id: string, name: string): ActStepExecResultBuilder {
    if (!this.stepsById.has(id)) {
      this.stepsById.set(id, new ActStepExecResultBuilder(name));
    }
    return this.stepsById.get(id)!;
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
    return {
      name: this.name,
      status: this.status!,
      output: this.outputLines.join('\n'),
      matrix: this.matrix,
      steps: Object.fromEntries(
        Array.from(this.stepsById.values()).map((stepBuilder) => {
          const step = stepBuilder.build();
          return [step.name, step];
        }),
      ),
    };
  }
}
