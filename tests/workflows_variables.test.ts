import { test, expect } from 'vitest';
import { inputPath, runner, workflowPath } from './fixtures.js';
import { ActExecStatus, ActRunner } from '../src/index.js';

function variablesWorkflowRunner(): ActRunner {
  return runner().withWorkflow({ file: workflowPath('print_variables') });
}

test('supports setting workflow variables directly', async () => {
  const result = await variablesWorkflowRunner()
    .withVariables({ values: { GREETING: 'Hello', NAME: 'Bruce' } })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});

test('supports setting workflow variables from file', async () => {
  const result = await variablesWorkflowRunner()
    .withVariables({ file: inputPath('greeting.variables') })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Falco!');
});

test('supports combining a values file with inline overrides', async () => {
  // greeting.variables sets GREETING=Hallo, NAME=Falco; NAME is overridden
  // inline while GREETING is left to come from the file, proving both
  // sources apply
  const result = await variablesWorkflowRunner()
    .withVariables({
      file: inputPath('greeting.variables'),
      values: { NAME: 'Bruce' },
    })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Bruce!');
});
