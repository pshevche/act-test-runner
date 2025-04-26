import { describe, expect, test } from 'bun:test';
import {
  cleanupDir,
  createTempDir,
  createTempWorkflowFile,
} from '../../src/utils/fsutils';
import fs from 'node:fs';
import { join } from 'node:path';

describe('fsutils', () => {
  test('removes directory with all temp files', () => {
    const dir = createTempDir();

    createTempWorkflowFile(dir, 'foo');
    fs.writeFileSync(join(dir, 'bar'), 'bar');

    cleanupDir(dir);

    expect(fs.existsSync(dir)).toBeFalse();
  });
});
