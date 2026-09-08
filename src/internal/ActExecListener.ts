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

import { ActJobExecResult } from '../ActJobExecResult.js';
import {
  ActOutput,
  ActOutputLevel,
  ActOutputListener,
} from '../ActOutputListener.js';
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
  stepResult?: JobOrStepResult;
  matrix: Object;
};

const JOB_LIFECYCLE_STEPS = new Set<string>(['Set up job', 'Complete job']);

class JobIterationTracker {
  private readonly matrixIdx: Map<string, number> = new Map<string, number>();

  private matrixKey(matrix: Object): string {
    return Object.values(matrix)
      .sort((a, b) => (a > b ? 1 : -1))
      .reduce((prev, curr) => `${prev}_${curr}`);
  }

  iterationIndex(matrix: Object): number {
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
      const iterationNumber = this.getJobIterationIdx(
        output.jobID!,
        output.matrix,
      );
      const jobName =
        iterationNumber === undefined
          ? output.jobID!
          : `${output.jobID}_${iterationNumber}`;

      const jobBuilder = this.createOrGetBuilder(jobName);

      jobBuilder.output(msg);

      // mark job as run only if it executed meaningful steps
      if (this.isExecutedStep(output)) {
        jobBuilder.stepCompleted();
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

  private isExecutedStep(output: JsonOutput): boolean {
    return (
      output.step !== undefined &&
      !JOB_LIFECYCLE_STEPS.has(output.step!) &&
      output.stepResult !== undefined &&
      output.stepResult !== 'skipped'
    );
  }

  private toActOutput(jsonOutput: JsonOutput): ActOutput {
    const job = this.hasJobContext(jsonOutput)
      ? { id: jsonOutput.jobID!, name: jsonOutput.job! }
      : undefined;
    return {
      time: jsonOutput.time,
      level: jsonOutput.level,
      message: jsonOutput.msg,
      job: job,
    };
  }

  getOutput(): string {
    return this.execOutput.join('\n');
  }

  getJobs(): Map<string, ActJobExecResult> {
    return new Map(
      Array.from(this.jobsByName).map(([name, jobBuilder]) => [
        name,
        jobBuilder.build(),
      ]),
    );
  }

  private createOrGetBuilder(jobName: string): ActJobExecResultBuilder {
    if (!this.jobsByName.has(jobName)) {
      this.jobsByName.set(jobName, new ActJobExecResultBuilder(jobName));
    }
    return this.jobsByName.get(jobName)!;
  }

  private getJobIterationIdx(
    jobName: string,
    matrix: Object,
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
