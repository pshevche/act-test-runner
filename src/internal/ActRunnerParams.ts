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

import { WebhookEventName } from '@octokit/webhooks-types';
import { ActResourceSpec } from './ActResourceSpec.js';
import { checkExists } from '../utils/checks.js';
import { firstDefined } from '../utils/objects.js';

export const MANAGED_ACT_PARAMS: Set<string> = new Set([
  '--workflows',
  '-W',
  '--env-file',
  '--env',
  '--input-file',
  '--input',
  '--secret-file',
  '--secret',
  '-s',
  '--var-file',
  '--var',
  '--matrix',
  '--cache-server-path',
  '--cache-server-addr',
  '--cache-server-port',
  '--artifact-server-path',
  '--artifact-server-addr',
  '--artifact-server-port',
  '--detect-event',
  '--eventpath',
  '-e',
]);

export const INTERNAL_ACT_PARAMS: Set<string> = new Set(['--rm']);

export class ActRunnerParams<
  EventType extends WebhookEventName | undefined = undefined,
> {
  private readonly workflowsPath: string;
  private readonly eventPayloadFilePath: string | undefined;
  private readonly eventType: EventType | undefined;
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
    eventPayloadFilePath: string | undefined,
    eventType: EventType | undefined,
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
    this.eventPayloadFilePath = eventPayloadFilePath;
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

    this.addEvent(args, this.eventType, this.eventPayloadFilePath);

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
    eventPayloadFilePath: string | undefined,
  ) {
    args.push(
      firstDefined(
        () => eventType,
        () => '--detect-event',
      ),
    );
    if (eventPayloadFilePath !== undefined) {
      checkExists('event payload file', eventPayloadFilePath);
      args.push('--eventpath', eventPayloadFilePath);
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
