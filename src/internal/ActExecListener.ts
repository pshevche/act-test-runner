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

import {
  ActOutput,
  ActOutputLevel,
  ActOutputListener,
} from '../ActOutputListener.js';
import type { ActJobExecResult, ActMatrixValues } from '../ActRunnerResult.js';
import { ActJobExecResultBuilder } from './ActJobExecResultBuilder.js';
import { formattedMessage } from './outputFormatter.js';

type JobOrStepResult = 'success' | 'failure' | 'skipped';

type JsonOutput = {
  time: Date;
  level: ActOutputLevel;
  msg: string;
  job?: string;
  jobID?: string;
  jobResult?: JobOrStepResult;
  step?: string;
  stepID?: string[];
  stepResult?: JobOrStepResult;
  matrix: ActMatrixValues;
};

const JOB_LIFECYCLE_STEPS = new Set<string>(['Set up job', 'Complete job']);

class JobIterationTracker {
  private readonly matrixIdx: Map<string, number> = new Map<string, number>();

  private matrixKey(matrix: ActMatrixValues): string {
    return Object.entries(matrix)
      .map((value) => `${value[0]}\u0000${value[1]}`)
      .sort((a, b) => (a > b ? 1 : -1))
      .reduce((prev, curr) => `${prev}\u0000${curr}`);
  }

  iterationIndex(matrix: ActMatrixValues): number {
    const key = this.matrixKey(matrix);
    if (this.matrixIdx.has(key)) {
      return this.matrixIdx.get(key)!;
    } else {
      const newIterationIndex = this.matrixIdx.size + 1;
      this.matrixIdx.set(key, newIterationIndex);
      return newIterationIndex;
    }
  }
}

export class ActExecListener {
  private readonly execOutput: string[] = [];
  private readonly jobsByName: Map<string, ActJobExecResultBuilder> = new Map<
    string,
    ActJobExecResultBuilder
  >();
  private readonly jobIterationTrackers: Map<string, JobIterationTracker> =
    new Map<string, JobIterationTracker>();

  private readonly outputListener: ActOutputListener | undefined;

  constructor(outputListener?: ActOutputListener) {
    this.outputListener = outputListener;
  }

  onRawOutput(output: string) {
    const lines = output.toString().split('\n');
    lines.forEach((line) => {
      try {
        const jsonOutput = JSON.parse(line) as JsonOutput;
        this.onJsonOutput(jsonOutput);
      } catch (err) {
        if (err instanceof SyntaxError) {
          // persist unparseable output as-is
          this.execOutput.push(line);
        } else {
          throw err;
        }
      }
    });
  }

  private onJsonOutput(output: JsonOutput) {
    const actOutput = this.toActOutput(output);
    this.outputListener?.onOutput(actOutput);
    this.processOutput(output);
  }

  private processOutput(output: JsonOutput): void {
    const msg = formattedMessage(output.msg, output.job);
    this.execOutput.push(msg);
    if (this.hasJobContext(output)) {
      const jobBuilder = this.createOrGetBuilder(output.jobID!, output.matrix);

      jobBuilder.output(msg);

      // mark job as run only if it executed meaningful steps
      if (this.isExecutedStep(output)) {
        jobBuilder.stepCompleted();
      }

      if (this.isRealStep(output)) {
        const stepId = this.currentStepId(output) ?? output.step!;
        const stepBuilder = jobBuilder.step(stepId, output.step!);
        stepBuilder.output(msg);

        if (output.stepResult === 'failure') {
          stepBuilder.failed();
        } else if (output.stepResult === 'skipped') {
          stepBuilder.skipped();
        } else if (output.stepResult !== undefined) {
          stepBuilder.completed();
        }
      }

      if (output.jobResult !== undefined) {
        if (output.jobResult === 'failure') {
          jobBuilder.failed();
        } else {
          jobBuilder.completed();
        }
      }
    }
  }

  private hasJobContext(output: JsonOutput): boolean {
    return output.jobID !== undefined && output.job !== undefined;
  }

  private isRealStep(output: JsonOutput): boolean {
    return output.step !== undefined && !JOB_LIFECYCLE_STEPS.has(output.step!);
  }

  private isExecutedStep(output: JsonOutput): boolean {
    return (
      this.isRealStep(output) &&
      output.stepResult !== undefined &&
      output.stepResult !== 'skipped'
    );
  }

  private toActOutput(jsonOutput: JsonOutput): ActOutput {
    const job = this.hasJobContext(jsonOutput)
      ? { id: jsonOutput.jobID!, name: jsonOutput.job! }
      : undefined;
    const stepId = this.currentStepId(jsonOutput);
    const step =
      stepId !== undefined && jsonOutput.step !== undefined
        ? { id: stepId, name: jsonOutput.step }
        : undefined;
    return {
      time: jsonOutput.time,
      level: jsonOutput.level,
      message: jsonOutput.msg,
      job: job,
      step: step,
    };
  }

  // act reports step ids as a path (outermost to innermost, e.g. for
  // composite action steps); the innermost entry identifies the step
  // currently reporting output.
  private currentStepId(output: JsonOutput): string | undefined {
    return output.stepID !== undefined && output.stepID.length > 0
      ? output.stepID[output.stepID.length - 1]
      : undefined;
  }

  getOutput(): string {
    return this.execOutput.join('\n');
  }

  getJobs(): Record<string, ActJobExecResult> {
    return Object.fromEntries(
      Array.from(this.jobsByName).map(([name, jobBuilder]) => [
        name,
        jobBuilder.build(),
      ]),
    );
  }

  private createOrGetBuilder(
    jobId: string,
    matrix: ActMatrixValues,
  ): ActJobExecResultBuilder {
    const iterationNumber = this.getJobIterationIdx(jobId, matrix);
    const jobName =
      iterationNumber === undefined ? jobId : `${jobId}_${iterationNumber}`;

    if (!this.jobsByName.has(jobName)) {
      this.jobsByName.set(
        jobName,
        new ActJobExecResultBuilder(jobName, matrix),
      );
    }
    return this.jobsByName.get(jobName)!;
  }

  private getJobIterationIdx(
    jobName: string,
    matrix: ActMatrixValues,
  ): number | undefined {
    if (Object.keys(matrix).length == 0) {
      return undefined;
    }

    if (!this.jobIterationTrackers.has(jobName)) {
      this.jobIterationTrackers.set(jobName, new JobIterationTracker());
    }

    const iterationTracker = this.jobIterationTrackers.get(jobName)!;
    return iterationTracker.iterationIndex(matrix);
  }
}
