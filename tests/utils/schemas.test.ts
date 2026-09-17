import child_process from 'node:child_process';
import os from 'node:os';
import { describe, expect, it } from 'vitest';

import {
  cleanupDir,
  createTempDir,
  createTempEventPayloadFile,
} from '../../src/utils/fsutils.js';
import {
  actCliParams,
  ARTIFACT_SERVER_PARAMS_PREFIX,
  CACHE_SERVER_PARAMS_PREFIX,
  FileExistenceCheckRefinement,
  FileParamsSchema,
  parseArtifactServerOptions,
  parseCacheServerOptions,
  StripUndefinedValuesTransform,
} from '../../src/utils/schemas.js';

function getActOptions() {
  let jsonString: string = '[]';

  try {
    jsonString = child_process.execFileSync('act', ['--list-options'], {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        throw new Error(
          [
            "Could not find the 'act' executable on your PATH.",
            'Install it, then try again:',
            '  - MacOS:   `brew install act`',
            '  - Windows: `choco install act-cli (or: scoop install act)`',
            '  - Linux:    https://github.com/nektos/act#installation',
          ].join(os.EOL),
          { cause: error },
        );
      }

      /**
       * If act has exited with a non-zero code, `error` will highly likely
       * contain `stderr` property with the description of the failure
       */
      throw new Error(
        [
          "act --list-options' failed:",
          'stderr' in error && typeof error.stderr === `string`
            ? error.stderr.trim()
            : error.message,
        ].join(os.EOL),
        { cause: error },
      );
    }
  }

  return jsonString;
}

describe('Act options', () => {
  it('should keep act options in sync', () => {
    const actOptionsWithoutDefaultValues = (
      JSON.parse(getActOptions()) as Array<{
        name: string;
        type: string;
        description: string;
        default: string;
      }>
    ).map(({ name, type, description }) => ({ name, type, description }));
    expect(actOptionsWithoutDefaultValues).toEqual(actCliParams);
  });

  it('should correctly parse cache server options', () => {
    expect(
      parseCacheServerOptions({
        port: 123,
        path: '/tmp',
        addr: '127.0.0.1',
        'external-url': 'http://some-external-server:3333',
      }),
    ).toStrictEqual({
      [`${CACHE_SERVER_PARAMS_PREFIX}-port`]: 123,
      [`${CACHE_SERVER_PARAMS_PREFIX}-path`]: '/tmp',
      [`${CACHE_SERVER_PARAMS_PREFIX}-addr`]: '127.0.0.1',
      [`${CACHE_SERVER_PARAMS_PREFIX}-external-url`]:
        'http://some-external-server:3333',
    });
  });

  it('should correctly parse artifact server options', () => {
    expect(
      parseArtifactServerOptions({
        port: 123,
        path: '/tmp',
        addr: '127.0.0.1',
      }),
    ).toStrictEqual({
      [`${ARTIFACT_SERVER_PARAMS_PREFIX}-port`]: 123,
      [`${ARTIFACT_SERVER_PARAMS_PREFIX}-path`]: '/tmp',
      [`${ARTIFACT_SERVER_PARAMS_PREFIX}-addr`]: '127.0.0.1',
    });
  });

  it('should correctly parse artifact server options', () => {
    expect(
      parseArtifactServerOptions({
        port: 123,
        path: '/tmp',
        addr: '127.0.0.1',
      }),
    ).toStrictEqual({
      [`${ARTIFACT_SERVER_PARAMS_PREFIX}-port`]: 123,
      [`${ARTIFACT_SERVER_PARAMS_PREFIX}-path`]: '/tmp',
      [`${ARTIFACT_SERVER_PARAMS_PREFIX}-addr`]: '127.0.0.1',
    });
  });

  it('should correctly parse file options', () => {
    expect(
      FileParamsSchema.parse({
        'env-file': '/tmp/env',
        eventpath: '/tmp/event',
        'input-file': '/tmp/input',
        'secret-file': '/tmp/secret',
        'var-file': '/tmp/var',
        workflows: '/tmp/workflows',
      }),
    ).toStrictEqual({
      'env-file': '/tmp/env',
      eventpath: '/tmp/event',
      'input-file': '/tmp/input',
      'secret-file': '/tmp/secret',
      'var-file': '/tmp/var',
      workflows: '/tmp/workflows',
    });
  });

  it('should strip out undefined values', () => {
    expect(
      FileParamsSchema.pipe(StripUndefinedValuesTransform).parse({
        'env-file': '/tmp/env',
        eventpath: undefined,
        'input-file': '/tmp/input',
        'secret-file': undefined,
        'var-file': '/tmp/var',
        workflows: undefined,
      }),
    ).toStrictEqual({
      'env-file': '/tmp/env',
      'input-file': '/tmp/input',
      'var-file': '/tmp/var',
    });
  });

  it('should check if files exist', () => {
    const tmpDir = createTempDir();
    const eventpath = createTempEventPayloadFile(tmpDir, {
      action: 'opened',
      number: 10,
      pull_request: {
        base: { ref: 'main' },
        head: { ref: 'feature' },
        number: 10,
        state: 'open',
      },
    });

    expect(() =>
      FileParamsSchema.check(FileExistenceCheckRefinement).parse({
        eventpath,
        'input-file': '/tmp/input',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [ZodError: [
        {
          "code": "custom",
          "message": "The specified input values file does not exist on path: '/tmp/input'",
          "path": [
            "input-file"
          ]
        }
      ]]
    `);

    cleanupDir(tmpDir);
  });

  it('should check if workflow file or body has been provided', () => {
    expect(() =>
      FileParamsSchema.check(FileExistenceCheckRefinement).parse({
        workflows: undefined,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [ZodError: [
        {
          "code": "custom",
          "message": "Neither workflow file, nor workflow body haven't been specified. Use 'withWorkflow' method to specify either of those.",
          "path": [
            "workflows"
          ]
        }
      ]]
    `);
  });
});
