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

import type { ActValueSource } from '../ActRunnerOptions.js';
import type { ActMatrixValues } from '../ActRunnerResult.js';

import {
  AllManagedParams,
  ARTIFACT_SERVER_PARAMS_PREFIX,
  ArtifactServerOptions,
  ArtifactServerParamsSchema,
  CACHE_SERVER_PARAMS_PREFIX,
  CacheServerOptions,
  CacheServerParamsSchema,
  FileParamsSchema,
  INTERNAL_PARAMS,
} from '../utils/schemas.js';
import { parsePrefixedParamsSchema } from '../utils/zod.js';

export type ActCliParamsInput<
  EventType extends WebhookEventName | undefined = undefined,
> = {
  workflowsPath: string | undefined;
  eventPayloadFilePath: string | undefined;
  eventType: EventType | undefined;
  envsSource: ActValueSource | undefined;
  inputsSource: ActValueSource | undefined;
  secretsSource: ActValueSource | undefined;
  varsSource: ActValueSource | undefined;
  matrixValues: ActMatrixValues | undefined;
  cacheServer: CacheServerOptions | undefined;
  artifactServer: ArtifactServerOptions | undefined;
  additionalArgs: string[];
};

export class ActCliParams<
  EventType extends WebhookEventName | undefined = undefined,
> {
  private readonly workflowsPath: string | undefined;
  private readonly eventPayloadFilePath: string | undefined;
  private readonly eventType: EventType | undefined;
  private readonly envsSource: ActValueSource | undefined;
  private readonly inputsSource: ActValueSource | undefined;
  private readonly secretsSource: ActValueSource | undefined;
  private readonly varsSource: ActValueSource | undefined;
  private readonly matrixValues: ActMatrixValues | undefined;
  private readonly cacheServer: CacheServerOptions | undefined;
  private readonly artifactServer: ArtifactServerOptions | undefined;
  private readonly additionalArgs: string[];

  constructor(params: ActCliParamsInput<EventType>) {
    this.workflowsPath = params.workflowsPath;
    this.eventType = params.eventType;
    this.eventPayloadFilePath = params.eventPayloadFilePath;
    this.envsSource = params.envsSource;
    this.inputsSource = params.inputsSource;
    this.secretsSource = params.secretsSource;
    this.varsSource = params.varsSource;
    this.matrixValues = params.matrixValues;
    this.cacheServer = params.cacheServer;
    this.artifactServer = params.artifactServer;
    this.additionalArgs = params.additionalArgs;
  }

  asCliArgs(): string[] {
    const params: AllManagedParams = {
      env: [],
      input: [],
      var: [],
      secret: [],
      matrix: [],
      additionalArgs: [],
    };

    Object.assign(
      params,
      parsePrefixedParamsSchema({
        schema: CacheServerParamsSchema,
        input: this.cacheServer ?? {},
        prefix: CACHE_SERVER_PARAMS_PREFIX,
      }),
    );

    if (this.artifactServer && !this.artifactServer.path) {
      console.warn(
        'Artifact server path is not specified. The artifact server will not start without it.',
      );
    }

    Object.assign(
      params,
      parsePrefixedParamsSchema({
        schema: ArtifactServerParamsSchema,
        input: this.artifactServer ?? {},
        prefix: ARTIFACT_SERVER_PARAMS_PREFIX,
      }),
    );

    params.env?.push(
      ...Object.entries(this.envsSource?.values ?? {}).map(
        ([key, value]) => `${key}=${value}`,
      ),
    );

    params.input?.push(
      ...Object.entries(this.inputsSource?.values ?? {}).map(
        ([key, value]) => `${key}=${value}`,
      ),
    );

    params.secret?.push(
      ...Object.entries(this.secretsSource?.values ?? {}).map(
        ([key, value]) => `${key}=${value}`,
      ),
    );

    params.var?.push(
      ...Object.entries(this.varsSource?.values ?? {}).map(
        ([key, value]) => `${key}=${value}`,
      ),
    );

    params.matrix?.push(
      ...Object.entries(this.matrixValues ?? {}).map(
        ([key, value]) => `${key}:${value}`,
      ),
    );

    Object.assign(
      params,
      FileParamsSchema.transform((obj) => {
        /**
         * We should strip out `undefined` values here, otherwise we'll get URLs
         * like /Users/John/some-folder/undefined
         */
        return Object.fromEntries(
          Object.entries(obj).filter(([, v]) => v !== undefined),
        );
      }).parse({
        workflows: this.workflowsPath,
        'env-file': this.envsSource?.file,
        'input-file': this.inputsSource?.file,
        'secret-file': this.secretsSource?.file,
        'var-file': this.varsSource?.file,
        eventpath: this.eventPayloadFilePath,
      }),
    );

    params.additionalArgs.push(...this.additionalArgs);

    const args: string[] = [
      this.eventType ?? '--detect-event',
      ...INTERNAL_PARAMS,
    ];

    for (const [key, value] of Object.entries(params)) {
      if (key === 'additionalArgs') {
        for (const flag of value as string[]) {
          args.push(flag);
        }
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          for (const item of value) {
            args.push(`--${key}`, item);
          }
        }
      } else {
        args.push(`--${key}`, value as string);
      }
    }

    return args;
  }
}
