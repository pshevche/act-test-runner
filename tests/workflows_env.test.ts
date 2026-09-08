import { test, expect } from 'vitest';
import { inputPath, runner, workflowPath } from './fixtures.js';
import { ActExecStatus, ActRunner } from '../src/index.js';

function envWorkflowRunner(): ActRunner {
  return runner().withWorkflow({ file: workflowPath('print_env_variables') });
}

test('supports setting environment variable values directly', async () => {
  const result = await envWorkflowRunner()
    .withEnv({ values: { GREETING: 'Hello', NAME: 'Bruce' } })
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.jobs['print_greeting']!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});

test('supports setting environment variables from file', async () => {
  const result = await envWorkflowRunner()
    .withEnv({ file: inputPath('greeting.env') })
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.jobs['print_greeting']!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Falco!');
});

test('supports combining a values file with inline overrides', async () => {
  // greeting.env sets GREETING=Hallo, NAME=Falco; NAME is overridden inline
  // while GREETING is left to come from the file, proving both sources apply
  const result = await envWorkflowRunner()
    .withEnv({ file: inputPath('greeting.env'), values: { NAME: 'Bruce' } })
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.jobs['print_greeting']!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Bruce!');
});
