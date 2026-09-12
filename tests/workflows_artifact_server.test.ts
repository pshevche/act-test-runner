import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';

import { ActExecStatus, ActRunner } from '../src/index.js';
import { runner, workflowPath } from './fixtures.js';

function artifactServerWorkflowRunner(): ActRunner {
  return runner().withWorkflow({
    file: workflowPath('save_file_in_artifact_server'),
  });
}

const artifactServerDir = join(
  tmpdir(),
  'actTestRunner',
  'workflows_artifact_server',
);

describe('artifact server', () => {
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
      .withArtifactServer({ path: artifactServerDir })
      // required to execute upload-artifact action
      .withEnv({ values: { ACTIONS_RUNTIME_TOKEN: 'irrelevant' } })
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);
    expect(result.jobs['store_file_in_artifact_server']!.status).toBe(
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
});
