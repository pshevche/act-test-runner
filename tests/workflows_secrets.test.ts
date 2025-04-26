import { expect, test } from 'bun:test';
import { inputPath, runner, workflowPath } from './fixtures';
import { ActExecStatus, ActRunner } from '../src';

function secretsWorkflowRunner(): ActRunner {
  return runner()
    .withWorkflowFile(workflowPath('print_secrets'))
    .withAdditionalArgs('--insecure-secrets');
}

test('supports setting secrets values directly', async () => {
  const result = await secretsWorkflowRunner()
    .withSecretsValues(['GREETING', 'Hello'], ['NAME', 'Bruce'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});

test('supports setting secrets values from file', async () => {
  const result = await secretsWorkflowRunner()
    .withSecretsFile(inputPath('greeting.secrets'))
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Falco!');
});
