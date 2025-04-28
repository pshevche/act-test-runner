import { expect, test } from 'bun:test';
import { inputPath, runner, workflowPath } from './fixtures.ts';
import { ActExecStatus, ActRunner } from '../src/index.ts';

function variablesWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('print_variables'));
}

test('supports setting workflow variables directly', async () => {
  const result = await variablesWorkflowRunner()
    .withVariablesValues(['GREETING', 'Hello'], ['NAME', 'Bruce'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});

test('supports setting workflow variables from file', async () => {
  const result = await variablesWorkflowRunner()
    .withVariablesFile(inputPath('greeting.variables'))
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Falco!');
});
