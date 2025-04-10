import { expect, test } from 'bun:test';
import * as path from 'node:path';
import { ActExecStatus, ActRunner } from '../src';

test('fails if the specified workflows location does not exist', async () => {
  expect(() => new ActRunner().withWorkflowsPath('non-existing').run()).toThrow(
    "The specified workflows path 'non-existing' does not exist",
  );
});

test('runs single workflow file', async () => {
  const execResult = await new ActRunner()
    .withWorkflowsPath(
      path.resolve(
        __dirname,
        '/resources/workflows/always_passing_workflows.yml',
      ),
    )
    .run();

  expect(execResult.status).toBe(ActExecStatus.SUCCESS);
  expect(execResult.output).toContain('bla');
});
