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

import { spawn } from 'node:child_process';
import { ActWorkflowExecResult } from './ActWorkflowExecResult.js';
import { ActExecStatus } from './ActExecStatus.js';
import { ActRunnerError } from './ActRunnerError.js';
import { JobTrackingActExecListener } from './internal/JobTrackingActExecListener.js';
import { OutputForwardingActExecListener } from './internal/OutputForwardingActExecListener.js';

export interface RunnerArguments {
  asCliArgs(): string[];
}

export abstract class Runner<ARGS extends RunnerArguments> {
  private shouldForwardOutput: boolean = false;

  protected abstract command(): string[];

  protected abstract validatedArguments(): ARGS;

  protected cleanup(): void {}

  forwardOutput(): this {
    this.shouldForwardOutput = true;
    return this;
  }

  run(): Promise<ActWorkflowExecResult> {
    return new Promise<ActWorkflowExecResult>((resolve, reject) => {
      try {
        const args = this.validatedArguments();

        const executionListener = this.shouldForwardOutput
          ? new OutputForwardingActExecListener(
              new JobTrackingActExecListener(),
            )
          : new JobTrackingActExecListener();

        const cmd = this.command();
        const process = spawn(cmd[0], [...cmd.slice(1), ...args.asCliArgs()]);

        process.stdout.on('data', (data) =>
          executionListener.onStdOutput(data.toString().trimEnd()),
        );
        process.stderr.on('data', (data) =>
          executionListener.onStdError(data.toString().trimEnd()),
        );

        process.on('close', (code) => {
          this.cleanup();
          resolve(
            new ActWorkflowExecResult(
              code === 0 ? ActExecStatus.SUCCESS : ActExecStatus.FAILED,
              executionListener.getOutput(),
              executionListener.getJobs(),
            ),
          );
        });
      } catch (err) {
        if (err instanceof ActRunnerError) {
          reject(err);
          return;
        }
        reject(
          new ActRunnerError(
            `Unexpected error occurred when executing runner: ${err}`,
          ),
        );
      }
    });
  }
}
