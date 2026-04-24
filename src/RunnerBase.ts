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
import {
  cleanupDir,
  createTempDir,
  createTempWorkflowFile,
} from './utils/fsutils.js';
import { firstDefined } from './utils/objects.js';
import { checkExists, checkOneDefined } from './utils/checks.js';
import { ActResourceSpec } from './internal/ActResourceSpec.js';

/**
 * Base class for workflow runners that invoke a CLI tool to execute GitHub Actions workflows locally.
 *
 * Subclasses must override the {@link command} method to specify the executable and any subcommand.
 *
 * The runner cannot be used concurrently due to limitations on the underlying tool side.
 */
export abstract class RunnerBase {
  private workflowFile: string | undefined;
  private workingDir: string | undefined;
  private workflowBody: string | undefined;
  private eventType: string | undefined;
  private eventPayloadFile: string | undefined;
  private envFile: string | undefined;
  private envValues: Map<String, String> = new Map<String, String>();
  private inputsFile: string | undefined;
  private inputsValues: Map<String, String> = new Map<String, String>();
  private secretsFile: string | undefined;
  private secretsValues: Map<String, String> = new Map<String, String>();
  private variablesFile: string | undefined;
  private variablesValues: Map<String, String> = new Map<String, String>();
  private matrix: Map<String, any> = new Map<String, any>();
  private cacheServer: ActResourceSpec | undefined;
  private artifactServer: ActResourceSpec | undefined;
  private additionalArgs: string[] = [];
  private shouldForwardOutput: boolean = false;

  /**
   * Returns the command array to spawn the runner process.
   * The first element is the executable, subsequent elements are subcommands.
   */
  protected abstract command(): string[];

  /**
   * Sets the directory to use for the runner's storage needs (default: directory in user's temp folder).
   * @param {string} workingDir - the runner's working directory
   */
  withWorkingDir(workingDir: string): this {
    this.workingDir = workingDir;
    return this;
  }

  /**
   * Specifies the GitHub workflow file to run.
   * Only one of `workflowPath` and `workflowBody` can be set.
   * @param {string} workflowsPath - path to the workflow file to run
   */
  withWorkflowFile(workflowsPath: string): this {
    this.workflowFile = workflowsPath;
    return this;
  }

  /**
   * Specifies the content of the GitHub workflow to run.
   * Only one of `workflowPath` and `workflowBody` can be set.
   * @param {string} workflowBody - body of the workflow to run
   */
  withWorkflowBody(workflowBody: string): this {
    this.workflowBody = workflowBody;
    return this;
  }

  /**
   * Configures the event that triggers the workflow run (e.g., `push`).
   * If unspecified, the first event type specified in the workflow definition will be used.
   * @param type - type of the event to trigger the workflow
   * @param payloadFile - path to the JSON file containing the event payload
   */
  withEvent(
    type: string,
    payloadFile: string | undefined = undefined,
  ): this {
    this.eventType = type;
    this.eventPayloadFile = payloadFile;
    return this;
  }

  /**
   * Specifies the file containing environment variables to use when invoking the given workflow.
   * @param {string} envFile - file containing environment variables values to use as env in the containers
   */
  withEnvFile(envFile: string): this {
    this.envFile = envFile;
    return this;
  }

  /**
   * Sets environment variables to use when invoking the given workflow.
   * @param {...[string, string]} envValues - environment variable values to use as env in the containers
   */
  withEnvValues(...envValues: [string, string][]): this {
    envValues.forEach((entry) => this.envValues.set(entry[0], entry[1]));
    return this;
  }

  /**
   * Specifies the file containing inputs values to use when invoking the given workflow.
   * @param {string} inputsFile - input file to read and use as action input
   */
  withInputsFile(inputsFile: string): this {
    this.inputsFile = inputsFile;
    return this;
  }

  /**
   * Sets inputs values to use when invoking the given workflow.
   * @param {...[string, string]} inputsValues - action input to make available to actions
   */
  withInputsValues(...inputsValues: [string, string][]): this {
    inputsValues.forEach((entry) => this.inputsValues.set(entry[0], entry[1]));
    return this;
  }

  /**
   * Specifies the file containing secrets values to use when invoking the given workflow.
   * @param {string} secretsFile - secrets file to read and use as action input
   */
  withSecretsFile(secretsFile: string): this {
    this.secretsFile = secretsFile;
    return this;
  }

  /**
   * Sets secrets values to use when invoking the given workflow.
   * @param {...[string, string]} secretsValues - secrets to make available to actions
   */
  withSecretsValues(...secretsValues: [string, string][]): this {
    secretsValues.forEach((entry) =>
      this.secretsValues.set(entry[0], entry[1]),
    );
    return this;
  }

  /**
   * Specifies the file containing workflow variables values to use when invoking the given workflow.
   * @param {string} variablesFile - variables file to read and use as action input
   */
  withVariablesFile(variablesFile: string): this {
    this.variablesFile = variablesFile;
    return this;
  }

  /**
   * Sets variables values to use when invoking the given workflow.
   * @param {...[string, string]} variablesValues - secrets to make available to actions
   */
  withVariablesValues(...variablesValues: [string, string][]): this {
    variablesValues.forEach((entry) =>
      this.variablesValues.set(entry[0], entry[1]),
    );
    return this;
  }

  /**
   * Set matrix values to run the workflow with.
   * If undefined, all combinations specified in the workflow definition will be invoked.
   * @param {...[string, any]} matrixValues - matrix values to run the workflow with
   * @returns
   */
  withMatrix(...matrixValues: [string, any][]): this {
    matrixValues.forEach((entry) => this.matrix.set(entry[0], entry[1]));
    return this;
  }

  /**
   * Configures the cache server to be used by the given workflow.
   * @param {string} path - the path where the cache artifacts will be stored
   * @param {string | undefined } host - the address to which the cache server binds
   * @param {number | undefined } port - the port where the cache server listens
   */
  withCacheServer(
    path: string,
    host: string | undefined = undefined,
    port: number | undefined = undefined,
  ): this {
    this.cacheServer = new ActResourceSpec(path, host, port);
    return this;
  }

  /**
   * Configures the artifact server to be used by the given workflow.
   * @param {string} path - the path where the artifacts uploaded will be stored
   * @param {string | undefined } host - the address to which the artifact server binds
   * @param {number | undefined } port - the port where the artifact server listens
   */
  withArtifactServer(
    path: string,
    host: string | undefined = undefined,
    port: number | undefined = undefined,
  ): this {
    this.artifactServer = new ActResourceSpec(path, host, port);
    return this;
  }

  /**
   * Arbitrary additional arguments to pass to the runner execution.
   * @param {...string} args - additional arguments to invoke the runner with
   */
  withAdditionalArgs(...args: string[]): this {
    args.forEach((arg) => this.additionalArgs.push(arg));
    return this;
  }

  /**
   * Forwards the runner output to `console`.
   */
  forwardOutput(): this {
    this.shouldForwardOutput = true;
    return this;
  }

  /**
   * Invokes the runner with specified options.
   * @returns workflow execution result for inspection
   */
  run(): Promise<ActWorkflowExecResult> {
    return new Promise<ActWorkflowExecResult>((resolve, reject) => {
      try {
        const params = this.validateRunnerParams();

        const executionListener = this.shouldForwardOutput
          ? new OutputForwardingActExecListener(
              new JobTrackingActExecListener(),
            )
          : new JobTrackingActExecListener();

        const cmd = this.command();
        const process = spawn(cmd[0], [
          ...cmd.slice(1),
          ...(params as ActRunnerParams).asCliArgs(),
        ]);

        process.stdout.on('data', (data) =>
          executionListener.onStdOutput(data.toString().trimEnd()),
        );
        process.stderr.on('data', (data) =>
          executionListener.onStdError(data.toString().trimEnd()),
        );

        process.on('close', (code) => {
          cleanupDir(this.workingDir!);
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
        }
        reject(
          new ActRunnerError(
            `Unexpected error occurred when executing runner: ${err}`,
          ),
        );
      }
    });
  }

  private validateRunnerParams(): ActRunnerParams {
    this.workingDir = checkExists(
      'working directory',
      firstDefined(() => this.workingDir, createTempDir),
    );

    checkOneDefined(this.workflowFile, this.workflowBody);
    const workflowFilePath = checkExists(
      'workflow path',
      firstDefined(
        () => this.workflowFile,
        () => createTempWorkflowFile(this.workingDir!, this.workflowBody!),
      ),
    );

    return new ActRunnerParams(
      workflowFilePath,
      this.eventType,
      this.eventPayloadFile,
      this.envFile,
      this.envValues,
      this.inputsFile,
      this.inputsValues,
      this.secretsFile,
      this.secretsValues,
      this.variablesFile,
      this.variablesValues,
      this.matrix,
      this.cacheServer,
      this.artifactServer,
      this.additionalArgs,
    );
  }
}

class ActRunnerParams {
  private readonly workflowsPath: string;
  private readonly eventType: string | undefined;
  private readonly eventPayloadFile: string | undefined;
  private readonly envFile: string | undefined;
  private readonly envValues: Map<String, String>;
  private readonly inputFile: string | undefined;
  private readonly inputValues: Map<String, String>;
  private readonly secretsFile: string | undefined;
  private readonly secretsValues: Map<String, String>;
  private readonly variablesFile: string | undefined;
  private readonly variablesValues: Map<String, String>;
  private readonly matrix: Map<String, any>;
  private readonly cacheServer: ActResourceSpec | undefined;
  private readonly artifactServer: ActResourceSpec | undefined;
  private readonly additionalArgs: string[];

  constructor(
    workflowsPath: string,
    eventType: string | undefined,
    eventPayloadFile: string | undefined,
    envFile: string | undefined,
    envValues: Map<String, String>,
    inputFile: string | undefined,
    inputValues: Map<String, String>,
    secretsFile: string | undefined,
    secretsValues: Map<String, String>,
    variablesFile: string | undefined,
    variablesValues: Map<String, String>,
    matrix: Map<String, any>,
    cacheServer: ActResourceSpec | undefined,
    artifactServer: ActResourceSpec | undefined,
    additionalArgs: string[],
  ) {
    this.workflowsPath = workflowsPath;
    this.eventType = eventType;
    this.eventPayloadFile = eventPayloadFile;
    this.envFile = envFile;
    this.envValues = envValues;
    this.inputFile = inputFile;
    this.inputValues = inputValues;
    this.secretsFile = secretsFile;
    this.secretsValues = secretsValues;
    this.variablesFile = variablesFile;
    this.variablesValues = variablesValues;
    this.matrix = matrix;
    this.cacheServer = cacheServer;
    this.artifactServer = artifactServer;
    this.additionalArgs = additionalArgs;
  }

  asCliArgs(): string[] {
    const args = ['--workflows', this.workflowsPath];

    this.addEvent(args, this.eventType, this.eventPayloadFile);

    this.addInputs(
      args,
      '--env-file',
      this.envFile,
      'env values file',
      '--env',
      this.envValues,
    );

    this.addInputs(
      args,
      '--input-file',
      this.inputFile,
      'input values file',
      '--input',
      this.inputValues,
    );

    this.addInputs(
      args,
      '--secret-file',
      this.secretsFile,
      'secrets values file',
      '--secret',
      this.secretsValues,
    );

    this.addInputs(
      args,
      '--var-file',
      this.variablesFile,
      'variables values file',
      '--var',
      this.variablesValues,
    );

    this.matrix.forEach((value, key) => {
      args.push('--matrix');
      args.push(`${key}:${value}`);
    });

    this.addResource(
      args,
      this.cacheServer,
      '--cache-server-path',
      '--cache-server-addr',
      '--cache-server-port',
    );

    this.addResource(
      args,
      this.artifactServer,
      '--artifact-server-path',
      '--artifact-server-addr',
      '--artifact-server-port',
    );

    this.additionalArgs.forEach((arg) => args.push(arg));

    return args;
  }

  private addEvent(
    args: string[],
    eventType: string | undefined,
    eventPayloadFile: string | undefined,
  ) {
    args.push(
      firstDefined(
        () => eventType,
        () => '--detect-event',
      ),
    );
    if (eventPayloadFile !== undefined) {
      checkExists('event payload file', eventPayloadFile);
      args.push('--eventpath', eventPayloadFile);
    }
  }

  private addInputs(
    args: string[],
    fileArg: string,
    file: string | undefined,
    fileLabel: string,
    valuesArg: string,
    values: Map<String, String>,
  ) {
    if (file !== undefined) {
      checkExists(fileLabel, file);
      args.push(fileArg, file);
    }

    if (values.size > 0) {
      values.forEach((value, key) => {
        args.push(valuesArg, `${key}=${value}`);
      });
    }
  }

  private addResource(
    args: string[],
    resource: ActResourceSpec | undefined,
    storageParam: string,
    addressParam: string,
    portParam: string,
  ) {
    if (resource !== undefined) {
      args.push(storageParam);
      args.push(resource.path);

      if (resource.host !== undefined) {
        args.push(addressParam);
        args.push(resource.host);
      }

      if (resource.port !== undefined) {
        args.push(portParam);
        args.push(resource.port.toString());
      }
    }
  }
}
