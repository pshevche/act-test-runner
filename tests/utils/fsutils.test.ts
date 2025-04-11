import { beforeEach, describe, expect, test } from 'bun:test';
import {
  cleanupDir,
  createTempDir,
  createTempWorkflowFile,
} from '../../src/utils/fsutils.ts';
import fs from 'node:fs';
import { join } from 'node:path';

describe('fsutils', () => {
  let dir: string;

  beforeEach(() => (dir = createTempDir()));

  test('removes all files from provided dir', () => {
    createTempWorkflowFile(dir, 'foo');
    fs.writeFileSync(join(dir, 'bar'), 'bar');
    cleanupDir(dir);

    expect(fs.readdirSync(dir)).toBeEmpty();
  });
});
