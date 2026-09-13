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

import { WebhookEventName } from '@octokit/webhooks-types';

import type {
  ActResourceServerSpec,
  ActValueSource,
} from '../ActRunnerOptions.js';
import type { ActMatrixValues } from '../ActRunnerResult.js';

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

export const INTERNAL_ACT_PARAMS: Set<string> = new Set(['--rm', '--json']);

export type ActCliParamsInput<
  EventType extends WebhookEventName | undefined = undefined,
> = {
  workflowsPath: string;
  eventPayloadFilePath: string | undefined;
  eventType: EventType | undefined;
  envSource: ActValueSource | undefined;
  inputsSource: ActValueSource | undefined;
  secretsSource: ActValueSource | undefined;
  variablesSource: ActValueSource | undefined;
  matrixValues: ActMatrixValues | undefined;
  cacheServer: ActResourceServerSpec | undefined;
  artifactServer: ActResourceServerSpec | undefined;
  additionalArgs: string[];
};

export class ActCliParams<
  EventType extends WebhookEventName | undefined = undefined,
> {
  private readonly workflowsPath: string;
  private readonly eventPayloadFilePath: string | undefined;
  private readonly eventType: EventType | undefined;
  private readonly envSource: ActValueSource | undefined;
  private readonly inputsSource: ActValueSource | undefined;
  private readonly secretsSource: ActValueSource | undefined;
  private readonly variablesSource: ActValueSource | undefined;
  private readonly matrixValues: ActMatrixValues | undefined;
  private readonly cacheServer: ActResourceServerSpec | undefined;
  private readonly artifactServer: ActResourceServerSpec | undefined;
  private readonly additionalArgs: string[];

  constructor(params: ActCliParamsInput<EventType>) {
    this.workflowsPath = params.workflowsPath;
    this.eventType = params.eventType;
    this.eventPayloadFilePath = params.eventPayloadFilePath;
    this.envSource = params.envSource;
    this.inputsSource = params.inputsSource;
    this.secretsSource = params.secretsSource;
    this.variablesSource = params.variablesSource;
    this.matrixValues = params.matrixValues;
    this.cacheServer = params.cacheServer;
    this.artifactServer = params.artifactServer;
    this.additionalArgs = params.additionalArgs;
  }

  asCliArgs(): string[] {
    const args = ['--workflows', this.workflowsPath];

    this.addEvent(args, this.eventType, this.eventPayloadFilePath);

    this.addInputs(
      args,
      '--env-file',
      'env values file',
      '--env',
      this.envSource,
    );

    this.addInputs(
      args,
      '--input-file',
      'input values file',
      '--input',
      this.inputsSource,
    );

    this.addInputs(
      args,
      '--secret-file',
      'secrets values file',
      '--secret',
      this.secretsSource,
    );

    this.addInputs(
      args,
      '--var-file',
      'variables values file',
      '--var',
      this.variablesSource,
    );

    Object.entries(this.matrixValues ?? {}).forEach(([key, value]) => {
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
    fileLabel: string,
    valuesArg: string,
    source: ActValueSource | undefined,
  ) {
    if (source?.file !== undefined) {
      checkExists(fileLabel, source.file);
      args.push(fileArg, source.file);
    }

    Object.entries(source?.values ?? {}).forEach(([key, value]) => {
      args.push(valuesArg, `${key}=${value}`);
    });
  }

  private addResource(
    args: string[],
    resource: ActResourceServerSpec | undefined,
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
