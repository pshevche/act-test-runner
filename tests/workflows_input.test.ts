import { expect, test } from 'bun:test';
import { inputPath, runner, workflowPath } from './fixtures.ts';
import { ActExecStatus, ActRunner } from '../src';

function inputWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('print_inputs'));
}

test('supports setting input values directly', async () => {
  const result = await inputWorkflowRunner()
    .withInputValues(['greeting', 'Hello'], ['name', 'Bruce'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});

test('supports setting input values from file', async () => {
  const result = await inputWorkflowRunner()
    .withInputFile(inputPath('greeting.input'))
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Falco!');
});
