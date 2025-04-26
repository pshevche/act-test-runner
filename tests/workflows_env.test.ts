import { expect, test } from 'bun:test';
import { inputPath, runner, workflowPath } from './fixtures';
import { ActExecStatus, ActRunner } from '../src';

function envWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('print_env_variables'));
}

test('supports setting environment variable values directly', async () => {
  const result = await envWorkflowRunner()
    .withEnvValues(['GREETING', 'Hello'], ['NAME', 'Bruce'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});

test('supports setting environment variables from file', async () => {
  const result = await envWorkflowRunner()
    .withEnvFile(inputPath('greeting.env'))
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Falco!');
});
