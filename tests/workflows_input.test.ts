import { test, expect } from 'vitest';
import { inputPath, runner, workflowPath } from './fixtures.js';
import { ActExecStatus, ActRunner } from '../src/index.js';

function inputWorkflowRunner(): ActRunner {
  return runner().withWorkflow({ file: workflowPath('print_inputs') });
}

test('supports setting input values directly', async () => {
  const result = await inputWorkflowRunner()
    .withInputs({ values: { greeting: 'Hello', name: 'Bruce' } })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});

test('supports setting input values from file', async () => {
  const result = await inputWorkflowRunner()
    .withInputs({ file: inputPath('greeting.input') })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Falco!');
});

test('supports combining a values file with inline overrides', async () => {
  // greeting.input sets greeting=Hallo, name=Falco; name is overridden inline
  // while greeting is left to come from the file, proving both sources apply
  const result = await inputWorkflowRunner()
    .withInputs({
      file: inputPath('greeting.input'),
      values: { name: 'Bruce' },
    })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Bruce!');
});
