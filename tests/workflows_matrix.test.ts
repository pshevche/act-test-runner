import { expect, test } from 'bun:test';
import { runner, workflowPath } from './fixtures';
import { ActExecStatus, ActRunner } from '../src';

function matrixWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('print_matrix_values'));
}

test('runs workflow with all matrix values by default', async () => {
  const result = await matrixWorkflowRunner().run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);

  expect(result.job('print_greeting-1')!.status).toBe(ActExecStatus.SUCCESS);
  expect(result.job('print_greeting-1')!.output).toContain('Hello, Bruce!');

  expect(result.job('print_greeting-2')!.status).toBe(ActExecStatus.SUCCESS);
  expect(result.job('print_greeting-2')!.output).toContain('Hello, Falco!');

  expect(result.job('print_greeting-3')!.status).toBe(ActExecStatus.SUCCESS);
  expect(result.job('print_greeting-3')!.output).toContain('Hallo, Bruce!');

  expect(result.job('print_greeting-4')!.status).toBe(ActExecStatus.SUCCESS);
  expect(result.job('print_greeting-4')!.output).toContain('Hallo, Falco!');
});

test('supports restricting matrix values to run with', async () => {
  const result = await matrixWorkflowRunner()
    .withMatrix(['greeting', 'Hallo'])
    .withMatrix(['name', 'Bruce'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Bruce!');
});
