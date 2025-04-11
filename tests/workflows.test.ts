import { expect, test } from 'bun:test';
import { ActExecStatus, ActWorkflowExecResult } from '../src';
import { runner, workflowPath } from './fixtures';

export async function run(
  workflowFile: string,
): Promise<ActWorkflowExecResult> {
  return runner().withWorkflowFile(workflowFile).run();
}

test('fails if the specified workflows location does not exist', async () => {
  expect(() => run('non-existing')).toThrow(
    "The specified workflows path 'non-existing' does not exist",
  );
});

test('report successful workflows', async () => {
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
