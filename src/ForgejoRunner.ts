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

import { RunnerBase } from './RunnerBase.js';

/**
 * Invokes `forgejo-runner exec`, allowing end-to-end testing of custom Forgejo actions and workflows.
 *
 * Typically, the test code will provide a workflow file or workflow body to run, as well as required workflow inputs, such as environment variables or secrets.
 *
 * Assertions can then be made on the outcome of the `run()` method invocation, such as the jobs run, workflow output, or artifacts persisted in the artifact server or action cache.
 *
 * The runner cannot be used concurrently due to limitations on the `forgejo-runner` side.
 */
export class ForgejoRunner extends RunnerBase {
  protected command(): string[] {
    return ['forgejo-runner', 'exec'];
  }
}
