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

import { Runner, RunnerArguments } from './Runner.js';
import { checkExists, checkOneDefined } from './utils/checks.js';
import { firstDefined } from './utils/objects.js';
import {
  cleanupDir,
  createTempDir,
  createTempWorkflowFile,
} from './utils/fsutils.js';

export class ForgejoRunner extends Runner<ForgejoRunnerArguments> {
  private workflowFile: string | undefined;
  private workingDir: string | undefined;
  private workflowBody: string | undefined;
  private eventType: string | undefined;
  private envFile: string | undefined;
  private envValues: Map<String, String> = new Map<String, String>();
  private secretsValues: Map<String, String> = new Map<String, String>();
  private variablesValues: Map<String, String> = new Map<String, String>();
  private additionalArgs: string[] = [];

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
   */
  withEvent(type: string): this {
    this.eventType = type;
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
   * Arbitrary additional arguments to pass to the runner execution.
   * @param {...string} args - additional arguments to invoke the runner with
   */
  withAdditionalArgs(...args: string[]): this {
    args.forEach((arg) => this.additionalArgs.push(arg));
    return this;
  }

  protected command(): string[] {
    return ['forgejo-runner', 'exec'];
  }

  protected validatedArguments(): ForgejoRunnerArguments {
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

    return new ForgejoRunnerArguments(
      workflowFilePath,
      this.eventType,
      this.envFile,
      this.envValues,
      this.secretsValues,
      this.variablesValues,
      this.additionalArgs,
    );
  }

  protected cleanup(): void {
    cleanupDir(this.workingDir!);
  }
}

class ForgejoRunnerArguments implements RunnerArguments {
  private readonly workflowsPath: string;
  private readonly eventType: string | undefined;
  private readonly envFile: string | undefined;
  private readonly envValues: Map<String, String>;
  private readonly secretsValues: Map<String, String>;
  private readonly variablesValues: Map<String, String>;
  private readonly additionalArgs: string[];

  constructor(
    workflowsPath: string,
    eventType: string | undefined,
    envFile: string | undefined,
    envValues: Map<String, String>,
    secretsValues: Map<String, String>,
    variablesValues: Map<String, String>,
    additionalArgs: string[],
  ) {
    this.workflowsPath = workflowsPath;
    this.eventType = eventType;
    this.envFile = envFile;
    this.envValues = envValues;
    this.secretsValues = secretsValues;
    this.variablesValues = variablesValues;
    this.additionalArgs = additionalArgs;
  }

  asCliArgs(): string[] {
    const args = ['--workflows', this.workflowsPath];

    if (this.eventType !== undefined) {
      args.push('--event', this.eventType);
    } else {
      args.push('--detect-event');
    }

    if (this.envFile !== undefined) {
      checkExists('env values file', this.envFile);
      args.push('--env-file', this.envFile);
    }

    if (this.envValues.size > 0) {
      this.envValues.forEach((value, key) => {
        args.push('--env', `${key}=${value}`);
      });
    }

    if (this.secretsValues.size > 0) {
      this.secretsValues.forEach((value, key) => {
        args.push('--secret', `${key}=${value}`);
      });
    }

    if (this.variablesValues.size > 0) {
      this.variablesValues.forEach((value, key) => {
        args.push('--var', `${key}=${value}`);
      });
    }

    this.additionalArgs.forEach((arg) => args.push(arg));

    return args;
  }
}
