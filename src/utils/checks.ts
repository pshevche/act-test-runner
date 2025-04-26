import { ActRunnerError } from '../ActRunnerError';
import fs from 'node:fs';

export function checkOneDefined(first: any, second: any) {
  if (
    (first === undefined && second === undefined) ||
    (first !== undefined && second !== undefined)
  ) {
    throw new ActRunnerError(
      `Expected one value out of '${first}' and '${second}' to be defined`,
    );
  }
}

export function checkExists(label: string, path: string): string {
  if (!fs.existsSync(path)) {
    throw new ActRunnerError(`The specified ${label} '${path}' does not exist`);
  }

  return path;
}
