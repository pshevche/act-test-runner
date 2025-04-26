import { beforeEach, afterEach, expect, test } from 'bun:test';
import { runner, workflowPath } from './fixtures';
import { ActExecStatus, ActRunner } from '../src';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import fs from 'node:fs';

function cacheWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('save_file_in_cache'));
}

const customCacheDir = join(tmpdir(), 'actTestRunner', 'workflows_cache');
beforeEach(() => {
  if (!fs.existsSync(customCacheDir)) {
    fs.mkdirSync(customCacheDir, { recursive: true });
  }
});

afterEach(() => {
  if (fs.existsSync(customCacheDir)) {
    fs.rmdirSync(customCacheDir, { recursive: true });
  }
});

test('persists cache entries in configured directory', async () => {
  const result = await cacheWorkflowRunner()
    .withCacheServer(customCacheDir)
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  expect(result.job('store_file_in_cache')!.status).toBe(ActExecStatus.SUCCESS);

  const cacheArtifact = join(customCacheDir, 'cache', '01', '1');
  expect(fs.existsSync(cacheArtifact)).toBeTrue();
});

test('supports advanced cache configuration', async () => {
  const result = await cacheWorkflowRunner()
    .withCacheServer(customCacheDir, '192.168.178.35', 0)
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  expect(result.job('store_file_in_cache')!.status).toBe(ActExecStatus.SUCCESS);

  const cacheArtifact = join(customCacheDir, 'cache', '01', '1');
  expect(fs.existsSync(cacheArtifact)).toBeTrue();
});
