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

import { ActJobExecResult } from '../ActJobExecResult';
import { ActJobExecResultBuilder } from './ActJobExecResultBuilder';
import type { ActExecListener } from './ActExecListener';

export class JobTrackingActExecListener implements ActExecListener {
  private readonly execOutput: string[] = [];
  private readonly jobsByName: Map<String, ActJobExecResultBuilder> = new Map<
    String,
    ActJobExecResultBuilder
  >();

  onStdOutput(output: string) {
    this.onStdOutputOrError(output);
  }

  onStdError(output: string) {
    this.onStdOutputOrError(output);
  }

  private onStdOutputOrError(output: string) {
    const lines = output.toString().split('\n');
    lines.forEach((line) => {
      this.execOutput.push(line);
      this.maybeProcessJobOutput(line);
    });
  }

  private maybeProcessJobOutput(line: string) {
    if (line.startsWith('[')) {
      const jobName = this.extractJobName(line);
      const jobBuilder = this.createOrGetBuilder(jobName);

      jobBuilder.output(line);

      if (line.includes('Success - Main')) {
        jobBuilder.stepCompleted();
      } else if (line.endsWith('Job succeeded')) {
        jobBuilder.completed();
      } else if (line.endsWith('Job failed')) {
        jobBuilder.failed();
      }
    }
  }

  private extractJobName(line: string) {
    const prefixSeparator = line.indexOf('/');
    const prefixEnd = line.indexOf(']');
    return line.substring(prefixSeparator + 1, prefixEnd).trim();
  }

  getOutput(): string {
    return this.execOutput.join('\n');
  }

  getJobs(): Map<String, ActJobExecResult> {
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
}
