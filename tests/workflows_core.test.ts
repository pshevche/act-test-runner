import { ActExecStatus, ActWorkflowExecResult } from '../src/index.js';
import { runner, workflowPath } from './fixtures.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

export async function run(
  workflowFile: string,
): Promise<ActWorkflowExecResult> {
  return runner().withWorkflowFile(workflowFile).run();
}

const customWorkingDir = join(tmpdir(), 'actTestRunner', 'workflows_core');
beforeEach(() => {
  if (!existsSync(customWorkingDir)) {
    mkdirSync(customWorkingDir, { recursive: true });
  }
});

afterEach(() => {
  if (existsSync(customWorkingDir)) {
    rmSync(customWorkingDir, { recursive: true, force: true });
  }
});

test('reports successful workflows', async () => {
  const result = await run(workflowPath('always_passing_workflow'));

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  expect(result.output).toContain('Hello, World!');
  expect(result.jobs.size).toBe(1);

  const successfulJob = result.job('successful_job')!;
  expect(successfulJob.status).toBe(ActExecStatus.SUCCESS);
  expect(successfulJob.output).toContain('Hello, World!');
});

test('captures workflow failures', async () => {
  const result = await run(workflowPath('always_failing_workflow'));

  expect(result.status).toBe(ActExecStatus.FAILED);
  expect(result.output).toContain('Hello, World!');
  expect(result.jobs.size).toBe(1);

  const failingJob = result.job('failing_job')!;
  expect(failingJob.status).toBe(ActExecStatus.FAILED);
  expect(failingJob.output).toContain('Hello, World!');
});

test('reports all jobs', async () => {
  const result = await run(
    workflowPath('workflow_with_failing_and_passing_jobs'),
  );

  expect(result.status).toBe(ActExecStatus.FAILED);
  expect(result.output).toContain('I succeed!');
  expect(result.output).toContain('I fail!');
  expect(result.jobs.size).toBe(2);

  const successfulJob = result.job('successful_job')!;
  expect(successfulJob.status).toBe(ActExecStatus.SUCCESS);
  expect(successfulJob.output).toContain('I succeed!');
  expect(successfulJob.output).not.toContain('I fail!');

  const failingJob = result.job('failing_job')!;
  expect(failingJob.status).toBe(ActExecStatus.FAILED);
  expect(failingJob.output).toContain('I fail!');
  expect(failingJob.output).not.toContain('I succeed!');
});

test('supports defining workflow body instead of file', async () => {
  const result = await runner()
    .withWorkflowBody(
      `
name: Simple passing workflow
on: [push]

jobs:
  successful_job:
    runs-on: ubuntu-latest
    steps:
      - name: Successful step
        run: echo "Hello, World!"
  `,
    )
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  expect(result.output).toContain('Hello, World!');
  expect(result.jobs.size).toBe(1);

  const successfulJob = result.job('successful_job')!;
  expect(successfulJob.status).toBe(ActExecStatus.SUCCESS);
  expect(successfulJob.output).toContain('Hello, World!');
});

test('supports defining custom working directory', async () => {
  const result = await runner()
    .withWorkingDir(customWorkingDir)
    .withWorkflowBody(
      `
name: Simple passing workflow
on: [push]

jobs:
  successful_job:
    runs-on: ubuntu-latest
    steps:
      - name: Successful step
        run: echo "Hello, World!"
  `,
    )
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  expect(result.output).toContain('Hello, World!');
  expect(result.jobs.size).toBe(1);

  const successfulJob = result.job('successful_job')!;
  expect(successfulJob.status).toBe(ActExecStatus.SUCCESS);
  expect(successfulJob.output).toContain('Hello, World!');
});
