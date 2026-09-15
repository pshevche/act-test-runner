import { describe, test, expect } from 'vitest';

import { ActExecStatus, ActRunner } from '../src/index.js';
import { runner, workflowPath } from './fixtures.js';

function matrixWorkflowRunner(): ActRunner {
  return runner().withWorkflow({ file: workflowPath('print_matrix_values') });
}

describe('matrix', () => {
  test('runs workflow with all matrix values by default', async () => {
    const result = await matrixWorkflowRunner().run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);

    const matrixJobs = Object.values(result.jobs);
    expect(
      matrixJobs.every((job) => job.status === ActExecStatus.SUCCESS),
    ).toBe(true);
    expect(matrixJobs.map((it) => it.name)).toEqual([
      'print_greeting_1',
      'print_greeting_2',
      'print_greeting_3',
      'print_greeting_4',
    ]);

    const job1 = matrixJobs.find((job) =>
      job.output.includes('Hello, Bruce!'),
    )!;
    expect(job1.matrix).toStrictEqual({ greeting: 'Hello', name: 'Bruce' });

    const job2 = matrixJobs.find((job) =>
      job.output.includes('Hello, Falco!'),
    )!;
    expect(job2.matrix).toStrictEqual({ greeting: 'Hello', name: 'Falco' });

    const job3 = matrixJobs.find((job) =>
      job.output.includes('Hallo, Bruce!'),
    )!;
    expect(job3.matrix).toStrictEqual({ greeting: 'Hallo', name: 'Bruce' });

    const job4 = matrixJobs.find((job) =>
      job.output.includes('Hallo, Falco!'),
    )!;
    expect(job4.matrix).toStrictEqual({ greeting: 'Hallo', name: 'Falco' });
  });

  test('supports restricting matrix values to run with', async () => {
    const result = await matrixWorkflowRunner()
      .withMatrix({ greeting: 'Hallo', name: 'Bruce' })
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);
    const job = result.jobs['print_greeting_1']!;
    expect(job).toHaveStatus(ActExecStatus.SUCCESS);
    expect(job.output).toContain('Hallo, Bruce!');
    expect(job.matrix).toStrictEqual({
      greeting: 'Hallo',
      name: 'Bruce',
    });
  });

  test('a later call to withMatrix replaces values set by an earlier call', async () => {
    const result = await matrixWorkflowRunner()
      .withMatrix({ greeting: 'Hallo', name: 'Bruce' })
      .withMatrix({ greeting: 'Hello' })
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);

    const matrixJobs = Object.values(result.jobs);
    expect(
      matrixJobs.every((job) => job.status === ActExecStatus.SUCCESS),
    ).toBe(true);

    // matrix jobs run concurrently, so their completion order (and thus
    // insertion order into `result.jobs`) isn't guaranteed - compare as a
    // set rather than asserting a specific order.
    const matrices = matrixJobs.map((it) => it.matrix);
    expect(matrices).toHaveLength(2);
    expect(matrices).toEqual(
      expect.arrayContaining([
        { greeting: 'Hello', name: 'Bruce' },
        { greeting: 'Hello', name: 'Falco' },
      ]),
    );
  });

  test('captures all supported matrix value types', async () => {
    const matrix = {
      number: 22,
      string: 'foo',
      boolean: false,
    };
    const result = await runner()
      .withWorkflow({ file: workflowPath('different_matrix_value_types') })
      .withMatrix(matrix)
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);
    const job = result.jobs['a_job_1']!;
    expect(job).toHaveStatus(ActExecStatus.SUCCESS);
    expect(job.matrix).toStrictEqual(matrix);
  });
});
