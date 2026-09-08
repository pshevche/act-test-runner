import { test, expect } from 'vitest';
import { runner, workflowPath } from './fixtures.js';
import { ActExecStatus, ActRunner } from '../src/index.js';

function matrixWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('print_matrix_values'));
}

test('runs workflow with all matrix values by default', async () => {
  const result = await matrixWorkflowRunner().run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);

  const matrixJobs = Array.from(result.jobs.values()).filter((job) =>
    job.name.startsWith('print_greeting'),
  );
  expect(matrixJobs.map((it) => it.name)).toEqual([
    'print_greeting_1',
    'print_greeting_2',
    'print_greeting_3',
    'print_greeting_4',
  ]);
  expect(matrixJobs.every((job) => job.status === ActExecStatus.SUCCESS)).toBe(
    true,
  );

  const allOutput = matrixJobs.map((job) => job.output).join('\n');
  expect(allOutput).toContain('Hello, Bruce!');
  expect(allOutput).toContain('Hello, Falco!');
  expect(allOutput).toContain('Hallo, Bruce!');
  expect(allOutput).toContain('Hallo, Falco!');
});

test('supports restricting matrix values to run with', async () => {
  const result = await matrixWorkflowRunner()
    .withMatrix({ greeting: 'Hallo', name: 'Bruce' })
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting_1')!;
  expect(job).toHaveStatus(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Bruce!');
});
