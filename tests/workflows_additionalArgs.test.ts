import { runner, workflowPath } from './fixtures.js';
import { ActExecStatus, ActRunner } from '../src/index.js';

function secretsWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('additional_args'));
}

test('supports setting complex additional arguments that should fail in a workflow', async () => {
  const result = await secretsWorkflowRunner()
    // slim does not have git installed
    .withAdditionalArgs(['-P', 'node:16-buster-slim'])
    .run();

  expect(result.status).toBe(ActExecStatus.FAILED);
});

test('supports setting complex additional arguments that should succeed in a workflow', async () => {
  const result = await secretsWorkflowRunner()
    .withAdditionalArgs(['-P', 'ubuntu-latest=catthehacker/ubuntu:act-latest'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
});
