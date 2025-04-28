import { runner, workflowPath } from './fixtures.js';
import { ActExecStatus, ActRunner } from '../src/index.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

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
  if (!existsSync(artifactServerDir)) {
    mkdirSync(artifactServerDir, { recursive: true });
  }
});

afterEach(() => {
  if (existsSync(artifactServerDir)) {
    rmSync(artifactServerDir, { recursive: true, force: true });
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
  expect(existsSync(storedArtifact)).toBe(true);
});

// does not work on CI due to conflicting address
if (process.env.CI === undefined) {
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
    expect(existsSync(storedArtifact)).toBe(true);
  });
}
