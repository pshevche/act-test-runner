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

import type {
  ActJobExecResult,
  ActMatrixValues,
  ActStepExecResult,
} from '../ActRunnerResult.js';

import { ActJobOrStepDescriptor } from '../ActOutputListener.js';
import { ActExecStatus } from '../ActRunnerResult.js';
import {
  formattedMessage,
  JobOrStepResult,
  JsonOutput,
  stepDescriptor,
} from './ActJsonOutput.js';
import { ActStepExecResultBuilder as ActStepOutputProcessor } from './ActStepOutputProcessor.js';

const JOB_LIFECYCLE_STEPS = new Set<string>(['Set up job', 'Complete job']);

export class ActJobOutputProcessor {
  private readonly name: string;
  private readonly matrix: ActMatrixValues;
  private hasExecutedSteps: boolean = false;
  private status: ActExecStatus | undefined;
  private readonly outputLines: string[] = [];
  private readonly steps: ActStepExecResult[] = [];
  private currentStepProcessor: ActStepOutputProcessor | undefined;

  constructor(name: string, matrix: ActMatrixValues) {
    this.name = name;
    this.matrix = matrix;
  }

  processOutput(output: JsonOutput) {
    const msg = formattedMessage(output.msg, output.job);
    this.outputLines.push(msg);

    const step = stepDescriptor(output);
    if (step !== undefined) {
      // mark job as run only if it executed meaningful steps
      if (this.isExecutedStep(output)) {
        this.hasExecutedSteps = true;
      }

      const stepProcessor = this.getOrInitializeStepProcessor(step);
      stepProcessor.processOutput(output);
    }

    if (output.jobResult !== undefined) {
      this.completed(output.jobResult);
    }
  }

  private isNonLifecycleStep(output: JsonOutput): boolean {
    return output.step !== undefined && !JOB_LIFECYCLE_STEPS.has(output.step!);
  }

  private isExecutedStep(output: JsonOutput): boolean {
    return (
      this.isNonLifecycleStep(output) &&
      output.stepResult !== undefined &&
      output.stepResult !== 'skipped'
    );
  }

  private getOrInitializeStepProcessor(
    descriptor: ActJobOrStepDescriptor,
  ): ActStepOutputProcessor {
    if (this.currentStepProcessor === undefined) {
      // first step
      this.currentStepProcessor = new ActStepOutputProcessor(descriptor);
    } else if (
      this.isNewStep(this.currentStepProcessor.descriptor, descriptor)
    ) {
      // new step started
      this.steps.push(this.currentStepProcessor.buildResult());
      this.currentStepProcessor = new ActStepOutputProcessor(descriptor);
    }

    return this.currentStepProcessor;
  }

  private isNewStep(
    currentDescriptor: ActJobOrStepDescriptor,
    newDescriptor: ActJobOrStepDescriptor,
  ): boolean {
    return (
      currentDescriptor.id != newDescriptor.id ||
      currentDescriptor.name != newDescriptor.name
    );
  }

  private completed(result: JobOrStepResult) {
    if (this.currentStepProcessor !== undefined) {
      this.steps.push(this.currentStepProcessor.buildResult());
      this.currentStepProcessor = undefined;
    }

    if (result === 'failure') {
      this.status = ActExecStatus.FAILED;
    } else {
      this.status = this.hasExecutedSteps
        ? ActExecStatus.SUCCESS
        : ActExecStatus.SKIPPED;
    }
  }

  buildResult(): ActJobExecResult {
    return {
      name: this.name,
      status: this.status!,
      output: this.outputLines.join('\n'),
      matrix: this.matrix,
      steps: this.steps,
    };
  }
}
