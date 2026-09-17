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

import * as fs from 'node:fs';
import { z } from 'zod';

import { actCliParamsToZodSchema } from './zod.js';

/**
 * List of all act CLI params, produced by `act --list-options` command.
 * "default" properties have been striped out, as sone of the default values
 * depend on the current environment.
 */
export const actCliParams = [
  {
    name: 'action-cache-path',
    type: 'string',
    description:
      'Defines the path where the actions get cached and host workspaces created.',
  },
  {
    name: 'action-offline-mode',
    type: 'bool',
    description:
      'If action contents exists, it will not be fetch and pull again. If turn on this, will turn off force pull',
  },
  {
    name: 'actor',
    type: 'string',
    description: 'user that triggered the event',
  },
  {
    name: 'artifact-server-addr',
    type: 'string',
    description: 'Defines the address to which the artifact server binds.',
  },
  {
    name: 'artifact-server-path',
    type: 'string',
    description:
      'Defines the path where the artifact server stores uploads and retrieves downloads from. If not specified the artifact server will not start.',
  },
  {
    name: 'artifact-server-port',
    type: 'string',
    description: 'Defines the port where the artifact server listens.',
  },
  {
    name: 'bind',
    type: 'bool',
    description: 'bind working directory to container, rather than copy',
  },
  {
    name: 'bug-report',
    type: 'bool',
    description: 'Display system information for bug report',
  },
  {
    name: 'cache-server-addr',
    type: 'string',
    description: 'Defines the address to which the cache server binds.',
  },
  {
    name: 'cache-server-external-url',
    type: 'string',
    description:
      'Defines the external URL for if the cache server is behind a proxy. e.g.: https://act-cache-server.example.com. Be careful that there is no trailing slash.',
  },
  {
    name: 'cache-server-path',
    type: 'string',
    description: 'Defines the path where the cache server stores caches.',
  },
  {
    name: 'cache-server-port',
    type: 'uint16',
    description:
      'Defines the port where the artifact server listens. 0 means a randomly available port.',
  },
  {
    name: 'concurrent-jobs',
    type: 'int',
    description:
      'Maximum number of concurrent jobs to run. Default is the number of CPUs available.',
  },
  {
    name: 'container-architecture',
    type: 'string',
    description:
      'Architecture which should be used to run containers, e.g.: linux/amd64. If not specified, will use host default architecture. Requires Docker server API Version 1.41+. Ignored on earlier Docker server platforms.',
  },
  {
    name: 'container-cap-add',
    type: 'stringArray',
    description:
      'kernel capabilities to add to the workflow containers (e.g. --container-cap-add SYS_PTRACE)',
  },
  {
    name: 'container-cap-drop',
    type: 'stringArray',
    description:
      'kernel capabilities to remove from the workflow containers (e.g. --container-cap-drop SYS_PTRACE)',
  },
  {
    name: 'container-daemon-socket',
    type: 'string',
    description:
      'URI to Docker Engine socket (e.g.: unix://~/.docker/run/docker.sock or - to disable bind mounting the socket)',
  },
  {
    name: 'container-options',
    type: 'string',
    description:
      'Custom docker container options for the job container without an options property in the job definition',
  },
  {
    name: 'defaultbranch',
    type: 'string',
    description: 'the name of the main branch',
  },
  {
    name: 'detect-event',
    type: 'bool',
    description:
      'Use first event type from workflow as event that triggered the workflow',
  },
  {
    name: 'directory',
    type: 'string',
    description: 'working directory',
  },
  {
    name: 'dryrun',
    type: 'bool',
    description:
      'disable container creation, validates only workflow correctness',
  },
  {
    name: 'env',
    type: 'stringArray',
    description:
      'env to make available to actions with optional value (e.g. --env myenv=foo or --env myenv)',
  },
  {
    name: 'env-file',
    type: 'string',
    description: 'environment file to read and use as env in the containers',
  },
  {
    name: 'eventpath',
    type: 'string',
    description: 'path to event JSON file',
  },
  {
    name: 'github-instance',
    type: 'string',
    description:
      'GitHub instance to use. Only use this when using GitHub Enterprise Server.',
  },
  {
    name: 'graph',
    type: 'bool',
    description: 'draw workflows',
  },
  { name: 'help', type: 'bool', description: 'help for act' },
  {
    name: 'input',
    type: 'stringArray',
    description:
      'action input to make available to actions (e.g. --input myinput=foo)',
  },
  {
    name: 'input-file',
    type: 'string',
    description: 'input file to read and use as action input',
  },
  {
    name: 'insecure-secrets',
    type: 'bool',
    description: "NOT RECOMMENDED! Doesn't hide secrets while printing logs.",
  },
  {
    name: 'job',
    type: 'string',
    description: 'run a specific job ID',
  },
  {
    name: 'json',
    type: 'bool',
    description: 'Output logs in json format',
  },
  {
    name: 'list',
    type: 'bool',
    description: 'list workflows',
  },
  {
    name: 'list-options',
    type: 'bool',
    description: 'Print a json structure of compatible options',
  },
  {
    name: 'local-repository',
    type: 'stringArray',
    description:
      'Replaces the specified repository and ref with a local folder (e.g. https://github.com/test/test@v0=/home/act/test or test/test@v0=/home/act/test, the latter matches any hosts or protocols)',
  },
  {
    name: 'log-prefix-job-id',
    type: 'bool',
    description:
      'Output the job id within non-json logs instead of the entire name',
  },
  {
    name: 'man-page',
    type: 'bool',
    description: 'Print a generated manual page to stdout',
  },
  {
    name: 'matrix',
    type: 'stringArray',
    description:
      'specify which matrix configuration to include (e.g. --matrix java:13',
  },
  {
    name: 'network',
    type: 'string',
    description: 'Sets a docker network name. Defaults to host.',
  },
  {
    name: 'no-cache-server',
    type: 'bool',
    description: 'Disable cache server',
  },
  {
    name: 'no-recurse',
    type: 'bool',
    description:
      "Flag to disable running workflows from subdirectories of specified path in '--workflows'/'-W' flag",
  },
  {
    name: 'no-skip-checkout',
    type: 'bool',
    description:
      'Use actions/checkout instead of copying local files into container',
  },
  {
    name: 'platform',
    type: 'stringArray',
    description:
      'custom image to use per platform (e.g. -P ubuntu-18.04=nektos/act-environments-ubuntu:18.04)',
  },
  {
    name: 'privileged',
    type: 'bool',
    description: 'use privileged mode',
  },
  {
    name: 'pull',
    type: 'bool',
    description: 'pull docker image(s) even if already present',
  },
  {
    name: 'quiet',
    type: 'bool',
    description: 'disable logging of output from steps',
  },
  {
    name: 'rebuild',
    type: 'bool',
    description: 'rebuild local action docker image(s) even if already present',
  },
  {
    name: 'remote-name',
    type: 'string',
    description:
      'git remote name that will be used to retrieve url of git repo',
  },
  {
    name: 'replace-ghe-action-token-with-github-com',
    type: 'string',
    description:
      'If you are using replace-ghe-action-with-github-com  and you want to use private actions on GitHub, you have to set personal access token',
  },
  {
    name: 'replace-ghe-action-with-github-com',
    type: 'stringArray',
    description:
      'If you are using GitHub Enterprise Server and allow specified actions from GitHub (github.com), you can set actions on this. (e.g. --replace-ghe-action-with-github-com =github/super-linter)',
  },
  {
    name: 'reuse',
    type: 'bool',
    description:
      "don't remove container(s) on successfully completed workflow(s) to maintain state between runs",
  },
  {
    name: 'rm',
    type: 'bool',
    description:
      'automatically remove container(s)/volume(s) after a workflow(s) failure',
  },
  {
    name: 'secret',
    type: 'stringArray',
    description:
      'secret to make available to actions with optional value (e.g. -s mysecret=foo or -s mysecret)',
  },
  {
    name: 'secret-file',
    type: 'string',
    description:
      'file with list of secrets to read from (e.g. --secret-file .secrets)',
  },
  {
    name: 'strict',
    type: 'bool',
    description: 'use strict workflow schema',
  },
  {
    name: 'use-gitignore',
    type: 'bool',
    description:
      'Controls whether paths specified in .gitignore should be copied into container',
  },
  {
    name: 'use-new-action-cache',
    type: 'bool',
    description:
      'Enable using the new Action Cache for storing Actions locally',
  },
  {
    name: 'userns',
    type: 'string',
    description: 'user namespace to use',
  },
  {
    name: 'validate',
    type: 'bool',
    description: 'validate workflows',
  },
  {
    name: 'var',
    type: 'stringArray',
    description:
      'variable to make available to actions with optional value (e.g. --var myvar=foo or --var myvar)',
  },
  {
    name: 'var-file',
    type: 'string',
    description: 'file with list of vars to read from (e.g. --var-file .vars)',
  },
  {
    name: 'verbose',
    type: 'bool',
    description: 'verbose output',
  },
  {
    name: 'version',
    type: 'bool',
    description: 'version for act',
  },
  {
    name: 'watch',
    type: 'bool',
    description:
      'watch the contents of the local repo and run when files change',
  },
  {
    name: 'workflows',
    type: 'string',
    description: 'path to workflow file(s)',
  },
] as const;

/** Act CLI params schema, derived from the act CLI params list */
export const ActCliParamsSchema = actCliParamsToZodSchema(actCliParams)
  .strict()
  .partial();

// -------------------------------------------------------------------------- //

//region "Cache server CLI params"
export const CACHE_SERVER_PARAMS_PREFIX = 'cache-server' as const;

const CACHE_SERVER_PARAMS = [
  `${CACHE_SERVER_PARAMS_PREFIX}-addr`,
  `${CACHE_SERVER_PARAMS_PREFIX}-external-url`,
  `${CACHE_SERVER_PARAMS_PREFIX}-path`,
  `${CACHE_SERVER_PARAMS_PREFIX}-port`,
] as const;

export const CacheServerParamsSchema = ActCliParamsSchema.pick(
  z
    .record(z.enum(CACHE_SERVER_PARAMS), z.literal(true).default(true))
    .parse({}),
);

export type CacheServerParams = z.infer<typeof CacheServerParamsSchema>;
export type CacheServerOptions = {
  [
    Key in keyof CacheServerParams as Key extends `${typeof CACHE_SERVER_PARAMS_PREFIX}-${infer Option}`
      ? Option
      : never
  ]: CacheServerParams[Key];
};

export function parseCacheServerOptions(options?: CacheServerOptions) {
  return z
    .preprocess((data?: CacheServerOptions) => {
      return Object.fromEntries(
        Object.entries(data || {}).map(([key, value]) => [
          `${CACHE_SERVER_PARAMS_PREFIX}-${key}`,
          value,
        ]),
      );
    }, CacheServerParamsSchema)
    .parse(options);
}
//endregion

// -------------------------------------------------------------------------- //

//region "Artifact server CLI params"
export const ARTIFACT_SERVER_PARAMS_PREFIX = 'artifact-server' as const;

const ARTIFACT_SERVER_PARAMS = [
  `${ARTIFACT_SERVER_PARAMS_PREFIX}-addr`,
  `${ARTIFACT_SERVER_PARAMS_PREFIX}-path`,
  `${ARTIFACT_SERVER_PARAMS_PREFIX}-port`,
] as const;

export const ArtifactServerParamsSchema = ActCliParamsSchema.pick(
  z
    .record(z.enum(ARTIFACT_SERVER_PARAMS), z.literal(true).default(true))
    .parse({}),
);

export type ArtifactServerParams = z.infer<typeof ArtifactServerParamsSchema>;
export type ArtifactServerOptions = {
  [
    Key in keyof ArtifactServerParams as Key extends `${typeof ARTIFACT_SERVER_PARAMS_PREFIX}-${infer Option}`
      ? Option
      : never
  ]: ArtifactServerParams[Key];
};

export function parseArtifactServerOptions(options?: ArtifactServerOptions) {
  return z
    .preprocess((data?: ArtifactServerOptions) => {
      return Object.fromEntries(
        Object.entries(data || {}).map(([key, value]) => [
          `${ARTIFACT_SERVER_PARAMS_PREFIX}-${key}`,
          value,
        ]),
      );
    }, ArtifactServerParamsSchema)
    .parse(options);
}
//endregion

// -------------------------------------------------------------------------- //

//region "File CLI params"
const FILE_PARAMS = [
  'workflows',
  'env-file',
  'input-file',
  'secret-file',
  'var-file',
  'eventpath',
] as const;

const FileParamsSchemaShape = ActCliParamsSchema.pick(
  z.record(z.enum(FILE_PARAMS), z.literal(true).default(true)).parse({}),
).shape;

export const FileParamsSchema = z
  .object(FileParamsSchemaShape)
  .transform((obj) => {
    /**
     * We should strip out `undefined` values here, otherwise we'll get URLs
     * like /Users/John/some-folder/undefined
     */
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    );
  })
  .superRefine((data, ctx) => {
    for (const [key, value] of Object.entries(data)) {
      if (key === 'workflows' && !value) {
        ctx.addIssue({
          code: 'custom',
          message: `Neither workflow file, nor workflow body haven't been specified. Use 'withWorkflow' method to specify either of those.`,
          path: [key],
          continue: true,
        });
      }
      if (value && !fs.existsSync(value)) {
        const fileDescriptionMap: Record<(typeof FILE_PARAMS)[number], string> =
          {
            workflows: 'workflow',
            'env-file': 'env values',
            'input-file': 'input values',
            'secret-file': 'secret values',
            'var-file': 'var values',
            eventpath: 'event payload',
          };
        ctx.addIssue({
          code: 'custom',
          message: `The specified ${fileDescriptionMap[key as (typeof FILE_PARAMS)[number]]} file does not exist on path: '${value}'`,
          path: [key],
          continue: true,
        });
      }
    }
  });
//endregion

// -------------------------------------------------------------------------- //

//region "Rest CLI params"
const REST_PARAMS = [
  'env',
  'input',
  'secret',
  'var',
  'matrix',
  'detect-event',
] as const;

export const RestManagedParamsSchema = ActCliParamsSchema.pick(
  z.record(z.enum(REST_PARAMS), z.literal(true).default(true)).parse({}),
);
//endregion

// -------------------------------------------------------------------------- //

//region "All CLI params"
export const INTERNAL_PARAMS = new Set<string>(['--rm', '--json']);
export const ALL_MANAGED_PARAMS = new Set<string>(
  [
    ...CACHE_SERVER_PARAMS,
    ...ARTIFACT_SERVER_PARAMS,
    ...FILE_PARAMS,
    ...REST_PARAMS,
  ]
    .map((param) => `--${param}`)
    .concat(['-s', '-W', '-e']),
);

const AllManagedParamsSchema = z
  .object({
    ...CacheServerParamsSchema.shape,
    ...ArtifactServerParamsSchema.shape,
    ...RestManagedParamsSchema.shape,
    ...FileParamsSchemaShape,
  })
  .extend({
    additionalArgs: z.array(z.string()),
  });

export type AllManagedParams = z.infer<typeof AllManagedParamsSchema>;
//endregion
