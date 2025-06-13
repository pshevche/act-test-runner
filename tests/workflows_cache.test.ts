import { runner, workflowPath } from './fixtures.js';
import { ActExecStatus, ActRunner } from '../src/index.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

function cacheWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('save_file_in_cache'));
}

const customCacheDir = join(tmpdir(), 'actTestRunner', 'workflows_cache');
beforeEach(() => {
  if (!existsSync(customCacheDir)) {
    mkdirSync(customCacheDir, { recursive: true });
  }
});

afterEach(() => {
  if (existsSync(customCacheDir)) {
    rmSync(customCacheDir, { recursive: true, force: true });
  }
});

test('persists cache entries in configured directory', async () => {
  const result = await cacheWorkflowRunner()
    .withCacheServer(customCacheDir)
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  expect(result.job('store_file_in_cache')!.status).toBe(ActExecStatus.SUCCESS);

  const cacheArtifact = join(customCacheDir, 'cache', '01', '1');
  expect(existsSync(cacheArtifact)).toBe(true);
}, 60_000);
