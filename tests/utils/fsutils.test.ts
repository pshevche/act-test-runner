import {
  cleanupDir,
  createTempDir,
  createTempWorkflowFile,
} from '../../src/utils/fsutils.js';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

describe('fsutils', () => {
  test('removes directory with all temp files', () => {
    const dir = createTempDir();

    createTempWorkflowFile(dir, 'foo');
    writeFileSync(join(dir, 'bar'), 'bar');

    cleanupDir(dir);

    expect(existsSync(dir)).toBe(false);
  });
});
