import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { ActExecStatus, ActWorkflowExecResult } from '../src/index.js';
import { runner, workflowPath } from './fixtures.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

export async function run(
  workflowFile: string,
): Promise<ActWorkflowExecResult> {
  return runner().withWorkflow({ file: workflowFile }).run();
}

const customWorkingDir = join(tmpdir(), 'actTestRunner', 'workflows_core');

describe('core', () => {
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

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);
    expect(result.output).toContain('Hello, World!');
    expect(Object.keys(result.jobs).length).toBe(1);

    const successfulJob = result.jobs['successful_job']!;
    expect(successfulJob).toHaveStatus(ActExecStatus.SUCCESS);
    expect(successfulJob.output).toContain('Hello, World!');
    expect(successfulJob.matrix).toStrictEqual({});
  });

  test('captures workflow failures', async () => {
    const result = await run(workflowPath('always_failing_workflow'));

    expect(result).toHaveStatus(ActExecStatus.FAILED);
    expect(result.output).toContain('Hello, World!');
    expect(Object.keys(result.jobs).length).toBe(1);

    const failingJob = result.jobs['failing_job']!;
    expect(failingJob).toHaveStatus(ActExecStatus.FAILED);
    expect(failingJob.output).toContain('Hello, World!');
  });

  test('reports all jobs', async () => {
    const result = await run(
      workflowPath('workflow_with_failing_and_passing_jobs'),
    );

    expect(result).toHaveStatus(ActExecStatus.FAILED);
    expect(result.output).toContain('I succeed!');
    expect(result.output).toContain('I fail!');
    expect(Object.keys(result.jobs).length).toBe(2);

    const successfulJob = result.jobs['successful_job']!;
    expect(successfulJob).toHaveStatus(ActExecStatus.SUCCESS);
    expect(successfulJob.output).toContain('I succeed!');
    expect(successfulJob.output).not.toContain('I fail!');

    const failingJob = result.jobs['failing_job']!;
    expect(failingJob).toHaveStatus(ActExecStatus.FAILED);
    expect(failingJob.output).toContain('I fail!');
    expect(failingJob.output).not.toContain('I succeed!');
  });

  test('captures steps run by a job', async () => {
    const result = await run(workflowPath('workflow_with_multiple_steps'));

    expect(result).toHaveStatus(ActExecStatus.FAILED);

    const job = result.jobs['multi_step_job']!;
    expect(Object.keys(job.steps).length).toBe(2);

    const firstStep = job.steps['First step']!;
    expect(firstStep).toHaveStatus(ActExecStatus.SUCCESS);
    expect(firstStep.output).toContain('Step 1 output');
    expect(firstStep.output).not.toContain('Step 2 output');

    const secondStep = job.steps['Second step']!;
    expect(secondStep).toHaveStatus(ActExecStatus.FAILED);
    expect(secondStep.output).toContain('Step 2 output');
    expect(secondStep.output).not.toContain('Step 1 output');
  });

  test('supports defining workflow body instead of file', async () => {
    const result = await runner()
      .withWorkflow({
        body: `
name: Simple passing workflow
on: [push]

jobs:
  successful_job:
    runs-on: ubuntu-latest
    steps:
      - name: Successful step
        run: echo "Hello, World!"
  `,
      })
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);
    expect(result.output).toContain('Hello, World!');
    expect(Object.keys(result.jobs).length).toBe(1);

    const successfulJob = result.jobs['successful_job']!;
    expect(successfulJob).toHaveStatus(ActExecStatus.SUCCESS);
    expect(successfulJob.output).toContain('Hello, World!');
  });

  test('supports defining custom working directory', async () => {
    const result = await runner()
      .withWorkingDir(customWorkingDir)
      .withWorkflow({
        body: `
name: Simple passing workflow
on: [push]

jobs:
  successful_job:
    runs-on: ubuntu-latest
    steps:
      - name: Successful step
        run: echo "Hello, World!"
  `,
      })
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);
    expect(result.output).toContain('Hello, World!');
    expect(Object.keys(result.jobs).length).toBe(1);

    const successfulJob = result.jobs['successful_job']!;
    expect(successfulJob).toHaveStatus(ActExecStatus.SUCCESS);
    expect(successfulJob.output).toContain('Hello, World!');
  });
});
