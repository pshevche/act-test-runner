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

import { WebhookEventMap, WebhookEventName } from '@octokit/webhooks-types';
import { spawn } from 'node:child_process';

import type {
  ActValueSource,
  ActWorkflowSource,
  ActResourceServerSpec,
  ActProcessOptions,
} from './ActRunnerOptions.js';
import type {
  ActMatrixValues,
  ActWorkflowExecResult,
} from './ActRunnerResult.js';

import {
  ActOutputListener,
  CompositeActOutputListener,
  StdStreamOutputListener,
} from './ActOutputListener.js';
import { ActExecStatus, ActRunnerError } from './ActRunnerResult.js';
import {
  ActCliParams,
  INTERNAL_ACT_PARAMS,
  MANAGED_ACT_PARAMS,
} from './internal/ActCliParams.js';
import { ActExecListener } from './internal/ActExecListener.js';
import { checkExists, checkOneDefined } from './utils/checks.js';
import {
  cleanupDir,
  createTempDir,
  createTempEventPayloadFile,
  createTempWorkflowFile,
} from './utils/fsutils.js';
import { firstDefined } from './utils/objects.js';
import { PartialDeep } from './utils/types.js';

type EventPayload<
  TEventType extends WebhookEventName | undefined = undefined,
> =
  | (TEventType extends WebhookEventName
      ? PartialDeep<WebhookEventMap[TEventType]> | string
      : string)
  | undefined;

/**
 * Invokes `act`, allowing end-to-end testing of custom GitHub actions and
 * workflows.
 *
 * Typically, the test code will provide a workflow file or workflow body to
 * run, as well as required workflow inputs, such as environment variables or
 * secrets.
 *
 * Assertions can then be made on the outcome of the `run()` method invocation,
 * such as the jobs run, workflow output, or artifacts persisted in the artifact
 * server or action cache.
 *
 * The runner cannot be used concurrently due to limitations on the `act` side.
 *
 * Each instance is single-use: calling `run()` more than once on the same
 * instance rejects with an `ActRunnerError`. Create a new instance for each
 * run.
 */
export class ActRunner<
  TEventType extends WebhookEventName | undefined = undefined,
  TEventPayload extends EventPayload<TEventType> = undefined,
> {
  private actExecutable: string | undefined;
  private workingDir: string | undefined;
  private workflowSource: ActWorkflowSource | undefined;
  private eventType: TEventType | undefined;
  private eventPayloadFileOrBody: TEventPayload | undefined;
  private envSource: ActValueSource | undefined;
  private inputsSource: ActValueSource | undefined;
  private secretsSource: ActValueSource | undefined;
  private variablesSource: ActValueSource | undefined;
  private matrixValues: ActMatrixValues | undefined;
  private cacheServer: ActResourceServerSpec | undefined;
  private artifactServer: ActResourceServerSpec | undefined;
  private additionalArgs: string[] = [];
  private outputListener: ActOutputListener | undefined;
  private hasRun: boolean = false;

  /**
   * Sets the path to the `act` executable (default: `act` binary on the
   * `PATH`). Useful in the CI environments, where the executable is provisioned
   * on demand in a controlled location.
   *
   * @param actExecutable - Path to the `act` executable.
   */
  withActExecutable(actExecutable: string): this {
    this.actExecutable = actExecutable;
    return this;
  }

  /**
   * Sets the directory to use for the runner's storage needs (default:
   * directory in user's temp folder).
   *
   * @param {string} workingDir - The runner's working directory
   */
  withWorkingDir(workingDir: string): this {
    this.workingDir = workingDir;
    return this;
  }

  /**
   * Specifies the GitHub workflow to run, either as a file path or an inline
   * body.
   *
   * @param source - The workflow source
   */
  withWorkflow(source: ActWorkflowSource): this {
    this.workflowSource = source;
    return this;
  }

  /**
   * Configures the event that triggers the workflow run (e.g., `push`). If
   * unspecified, the first event type specified in the workflow definition will
   * be used.
   *
   * @param type - Type of the event to trigger the workflow
   * @param payloadFileOrBody - Event payload as plain JS object or path to the
   *   JSON file
   */
  withEvent<E extends WebhookEventName, EP extends EventPayload<E>>(
    type: E,
    payloadFileOrBody?: EP,
  ): ActRunner<E, EP> {
    this.eventType = type as unknown as TEventType;
    this.eventPayloadFileOrBody = payloadFileOrBody as unknown as TEventPayload;
    return this as unknown as ActRunner<E, EP>;
  }

  /**
   * Specifies environment variables to use when invoking the given workflow,
   * provided via a file, inline values, or both. Replaces any environment
   * variables set by a previous call to this method.
   *
   * @param source - Environment variables source
   */
  withEnv(source: ActValueSource): this {
    this.envSource = source;
    return this;
  }

  /**
   * Specifies inputs values to use when invoking the given workflow, provided
   * via a file, inline values, or both. Replaces any inputs values set by a
   * previous call to this method.
   *
   * @param source - Inputs values source
   */
  withInputs(source: ActValueSource): this {
    this.inputsSource = source;
    return this;
  }

  /**
   * Specifies secrets values to use when invoking the given workflow, provided
   * via a file, inline values, or both. Replaces any secrets values set by a
   * previous call to this method.
   *
   * @param source - Secrets values source
   */
  withSecrets(source: ActValueSource): this {
    this.secretsSource = source;
    return this;
  }

  /**
   * Specifies workflow variables values to use when invoking the given
   * workflow, provided via a file, inline values, or both. Replaces any
   * variables values set by a previous call to this method.
   *
   * @param source - Variables values source
   */
  withVariables(source: ActValueSource): this {
    this.variablesSource = source;
    return this;
  }

  /**
   * Set matrix values to run the workflow with. If undefined, all combinations
   * specified in the workflow definition will be invoked. Replaces any matrix
   * values set by a previous call to this method.
   *
   * @param matrixValues - Matrix values to run the workflow with
   */
  withMatrix(matrixValues: ActMatrixValues): this {
    this.matrixValues = matrixValues;
    return this;
  }

  /**
   * Configures the cache server to be used by the given workflow.
   *
   * @param spec - Cache server configuration
   */
  withCacheServer(spec: ActResourceServerSpec): this {
    this.cacheServer = spec;
    return this;
  }

  /**
   * Configures the artifact server to be used by the given workflow.
   *
   * @param spec - Artifact server configuration
   */
  withArtifactServer(spec: ActResourceServerSpec): this {
    this.artifactServer = spec;
    return this;
  }

  /**
   * Arbitrary additional arguments to pass to the `act` execution.
   *
   * @param {...string} args - Additional arguments to invoke `act` with
   */
  withAdditionalArgs(...args: string[]): this {
    args.forEach((arg) => this.additionalArgs.push(arg));
    return this;
  }

  /**
   * Forwards the act output to the supplied listeners. When no listener is
   * specified, forwards the output to the console.
   *
   * @param listeners - Output consumers.
   */
  forwardOutput(...listeners: ActOutputListener[]): this {
    this.outputListener =
      listeners.length === 0
        ? new StdStreamOutputListener()
        : new CompositeActOutputListener(listeners);
    return this;
  }

  /**
   * Invokes `act` with specified options.
   *
   * @param options - Options controlling this run, such as an abort signal
   * @returns Workflow execution result for inspection
   */
  run(options?: ActProcessOptions): Promise<ActWorkflowExecResult> {
    return new Promise<ActWorkflowExecResult>((resolve, reject) => {
      try {
        if (this.hasRun) {
          throw new ActRunnerError(
            'ActRunner instances cannot be reused; create a new instance for each run()',
          );
        }
        this.hasRun = true;

        const signal = options?.signal;
        if (signal?.aborted) {
          throw new ActRunnerError('act execution was aborted');
        }

        const params = this.validateRunnerParams();

        const executionListener = new ActExecListener(this.outputListener);

        // apply user arguments + additional internal arguments specific to test execution
        const args = [...params.asCliArgs(), '--rm', '--json'];
        const child = spawn(this.actExecutable ?? 'act', args);

        const onAbort = () => {
          child.kill();
        };
        signal?.addEventListener('abort', onAbort, { once: true });

        child.stdout.on('data', (data) =>
          executionListener.onRawOutput(data.toString().trimEnd()),
        );
        child.stderr.on('data', (data) =>
          executionListener.onRawOutput(data.toString().trimEnd()),
        );

        child.on('close', (code) => {
          signal?.removeEventListener('abort', onAbort);
          cleanupDir(this.workingDir!);
          if (signal?.aborted) {
            reject(new ActRunnerError('act execution was aborted'));
            return;
          }
          resolve({
            status: code === 0 ? ActExecStatus.SUCCESS : ActExecStatus.FAILED,
            output: executionListener.getOutput(),
            jobs: executionListener.getJobs(),
          });
        });

        child.on('error', (err) => {
          signal?.removeEventListener('abort', onAbort);
          reject(new ActRunnerError(`Failed to launch act: ${err.message}`));
        });
      } catch (err) {
        if (err instanceof ActRunnerError) {
          reject(err);
          return;
        }
        reject(
          new ActRunnerError(
            `Unexpected error occurred when executing act: ${err}`,
          ),
        );
      }
    });
  }

  private validateRunnerParams(): ActCliParams<TEventType> {
    if (this.actExecutable) {
      checkExists('act executable', this.actExecutable);
    }

    const workingDir = checkExists(
      'working directory',
      firstDefined(() => this.workingDir, createTempDir),
    );

    this.workingDir = workingDir;

    const workflowFile =
      this.workflowSource && 'file' in this.workflowSource
        ? this.workflowSource.file
        : undefined;
    const workflowBody =
      this.workflowSource && 'body' in this.workflowSource
        ? this.workflowSource.body
        : undefined;

    checkOneDefined(workflowFile, workflowBody);
    const workflowFilePath = checkExists(
      'workflow path',
      workflowFile ||
        (workflowBody !== undefined
          ? createTempWorkflowFile(workingDir, workflowBody)
          : undefined),
    );

    const eventPayloadFileOrBody = this.eventPayloadFileOrBody;
    const eventPayloadFilePath =
      typeof eventPayloadFileOrBody === 'object'
        ? createTempEventPayloadFile(workingDir, eventPayloadFileOrBody)
        : typeof eventPayloadFileOrBody === 'string'
          ? eventPayloadFileOrBody
          : undefined;

    const overwrittenManagedParams = this.additionalArgs.filter((it) =>
      MANAGED_ACT_PARAMS.has(it),
    );
    if (overwrittenManagedParams.length > 0) {
      throw new ActRunnerError(
        `The following act arguments must be set via dedicated ActRunner methods, and not via 'withAdditionalArguments': ${overwrittenManagedParams}`,
      );
    }

    const overwrittenInternalParams = this.additionalArgs.filter((it) =>
      INTERNAL_ACT_PARAMS.has(it),
    );
    if (overwrittenInternalParams.length > 0) {
      throw new ActRunnerError(
        `The following act arguments must not be set via 'withAdditionalArguments', as they are managed by the ActRunner: ${overwrittenInternalParams}`,
      );
    }

    return new ActCliParams({
      workflowsPath: workflowFilePath,
      eventPayloadFilePath,
      eventType: this.eventType,
      envSource: this.envSource,
      inputsSource: this.inputsSource,
      secretsSource: this.secretsSource,
      variablesSource: this.variablesSource,
      matrixValues: this.matrixValues,
      cacheServer: this.cacheServer,
      artifactServer: this.artifactServer,
      additionalArgs: this.additionalArgs,
    });
  }
}
