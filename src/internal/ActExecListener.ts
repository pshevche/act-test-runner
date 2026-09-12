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

import type { ActJobExecResult, ActMatrixValues } from '../ActRunnerResult.js';

import {
  ActOutput,
  ActOutputListener,
  ActJobOrStepDescriptor,
} from '../ActOutputListener.js';
import { ActJobOutputProcessor } from './ActJobOutputProcessor.js';
import {
  jobDescriptor,
  JsonOutput,
  formattedMessage,
  stepDescriptor,
} from './ActJsonOutput.js';
import { JobIterationTracker } from './JobIterationTracker.js';

export class ActExecListener {
  private readonly execOutput: string[] = [];
  private readonly jobsByName: Map<string, ActJobOutputProcessor> = new Map<
    string,
    ActJobOutputProcessor
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
        const actOutput = this.toActOutput(jsonOutput);
        this.outputListener?.onOutput(actOutput);
        this.processOutput(jsonOutput);
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

  getOutput(): string {
    return this.execOutput.join('\n');
  }

  getJobs(): Record<string, ActJobExecResult> {
    return Object.fromEntries(
      Array.from(this.jobsByName).map(([name, jobProcessor]) => [
        name,
        jobProcessor.buildResult(),
      ]),
    );
  }

  private toActOutput(jsonOutput: JsonOutput): ActOutput {
    return {
      time: jsonOutput.time,
      level: jsonOutput.level,
      message: jsonOutput.msg,
      job: jobDescriptor(jsonOutput),
      step: stepDescriptor(jsonOutput),
    };
  }

  private processOutput(output: JsonOutput): void {
    const msg = formattedMessage(output.msg, output.job);
    this.execOutput.push(msg);

    const job = jobDescriptor(output);
    if (job !== undefined) {
      const jobProcessor = this.getJobOutputProcessor(job, output.matrix);
      jobProcessor.processOutput(output);
    }
  }

  private getJobOutputProcessor(
    job: ActJobOrStepDescriptor,
    matrix: ActMatrixValues,
  ): ActJobOutputProcessor {
    const iterationNumber = this.getJobIterationIdx(job.id, matrix);
    const jobName =
      iterationNumber === undefined ? job.id : `${job.id}_${iterationNumber}`;

    if (!this.jobsByName.has(jobName)) {
      this.jobsByName.set(jobName, new ActJobOutputProcessor(jobName, matrix));
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
