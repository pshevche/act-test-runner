import child_process from 'node:child_process';
import os from 'node:os';
import { describe, expect, it } from 'vitest';

import { actCliParams } from '#utils/schemas';

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
});
