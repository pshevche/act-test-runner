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

import {
  ActOutputLevel,
  ActJobOrStepDescriptor,
} from '../ActOutputListener.js';
import { ActMatrixValues } from '../ActRunnerResult.js';

export type JobOrStepResult = 'success' | 'failure' | 'skipped';

export type JsonOutput = {
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

export function formattedMessage(
  message: string,
  jobName: string | undefined,
): string {
  if (jobName !== undefined) {
    return `[${jobName}] ${message}`.trim();
  } else {
    return message.trim();
  }
}

export function jobDescriptor(
  output: JsonOutput,
): ActJobOrStepDescriptor | undefined {
  if (output.job !== undefined && output.jobID !== undefined) {
    return {
      id: output.jobID,
      name: output.job,
    };
  }

  return undefined;
}

export function stepDescriptor(
  output: JsonOutput,
): ActJobOrStepDescriptor | undefined {
  // act reports step ids as a path (outermost to innermost, e.g. for
  // composite action steps); the innermost entry identifies the step
  // currently reporting output.
  if (
    output.step !== undefined &&
    output.stepID !== undefined &&
    output.stepID.length > 0
  ) {
    const lastStepIdSegment = output.stepID[output.stepID.length - 1];
    return {
      id: lastStepIdSegment,
      name: output.step,
    };
  }

  return undefined;
}
