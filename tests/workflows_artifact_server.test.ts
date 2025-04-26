import { beforeEach, afterEach, expect, test } from 'bun:test';
import { runner, workflowPath } from './fixtures';
import { ActExecStatus, ActRunner } from '../src';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import fs from 'node:fs';

function artifactServerWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(
    workflowPath('save_file_in_artifact_server'),
  );
}

const artifactServerDir = join(
  tmpdir(),
  'actTestRunner',
  'workflows_artifact_server',
);
beforeEach(() => {
  if (!fs.existsSync(artifactServerDir)) {
    fs.mkdirSync(artifactServerDir, { recursive: true });
  }
});

afterEach(() => {
  if (fs.existsSync(artifactServerDir)) {
    fs.rmdirSync(artifactServerDir, { recursive: true });
  }
});

test('persists workflow artifacts in configured directory', async () => {
  const result = await artifactServerWorkflowRunner()
    .withArtifactServer(artifactServerDir)
    // required to execute upload-artifact action
    .withEnvValues(['ACTIONS_RUNTIME_TOKEN', 'irrelevant'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  expect(result.job('store_file_in_artifact_server')!.status).toBe(
    ActExecStatus.SUCCESS,
  );

  const storedArtifact = join(
    artifactServerDir,
    '1',
    'greeting',
    'greeting.zip',
  );
  expect(fs.existsSync(storedArtifact)).toBeTrue();
});

test('supports advanced artifact server configuration', async () => {
  const result = await artifactServerWorkflowRunner()
    .withArtifactServer(artifactServerDir, '192.168.178.35', 34567)
    // required to execute upload-artifact action
    .withEnvValues(['ACTIONS_RUNTIME_TOKEN', 'irrelevant'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  expect(result.job('store_file_in_artifact_server')!.status).toBe(
    ActExecStatus.SUCCESS,
  );

  const storedArtifact = join(
    artifactServerDir,
    '1',
    'greeting',
    'greeting.zip',
  );
  expect(fs.existsSync(storedArtifact)).toBeTrue();
});
