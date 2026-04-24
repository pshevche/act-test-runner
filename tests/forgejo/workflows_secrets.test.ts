import { inputPath, workflowPath } from '../fixtures.js';
import { forgejoRunner } from './fixtures.js';
import { ActExecStatus, ForgejoRunner } from '../../src/index.js';

function secretsWorkflowRunner(): ForgejoRunner {
  return forgejoRunner()
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
