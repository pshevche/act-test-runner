import { test, expect } from 'vitest';
import { inputPath, runner, workflowPath } from './fixtures.js';
import { ActExecStatus, ActRunner } from '../src/index.js';

function secretsWorkflowRunner(): ActRunner {
  return runner()
    .withWorkflow({ file: workflowPath('print_secrets') })
    .withAdditionalArgs('--insecure-secrets');
}

test('supports setting secrets values directly', async () => {
  const result = await secretsWorkflowRunner()
    .withSecrets({ values: { GREETING: 'Hello', NAME: 'Bruce' } })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.jobs['print_greeting']!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});

test('supports setting secrets values from file', async () => {
  const result = await secretsWorkflowRunner()
    .withSecrets({ file: inputPath('greeting.secrets') })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.jobs['print_greeting']!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Falco!');
});

test('supports combining a values file with inline overrides', async () => {
  // greeting.secrets sets GREETING=Hallo, NAME=Falco; NAME is overridden
  // inline while GREETING is left to come from the file, proving both
  // sources apply
  const result = await secretsWorkflowRunner()
    .withSecrets({
      file: inputPath('greeting.secrets'),
      values: { NAME: 'Bruce' },
    })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.jobs['print_greeting']!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Bruce!');
});
