import { describe, test, expect } from 'vitest';

import { ActExecStatus, ActRunner } from '../src/index.js';
import { inputPath, runner, workflowPath } from './fixtures.js';

function variablesWorkflowRunner(): ActRunner {
  return runner().withWorkflow({ file: workflowPath('print_variables') });
}

describe('variables', () => {
  test('supports setting values directly', async () => {
    const result = await variablesWorkflowRunner()
      .withVariables({ values: { GREETING: 'Hello', NAME: 'Bruce' } })
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);
    const job = result.jobs['print_greeting']!;
    expect(job).toHaveStatus(ActExecStatus.SUCCESS);
    expect(job.output).toContain('Hello, Bruce!');
  });

  test('supports setting values from file', async () => {
    const result = await variablesWorkflowRunner()
      .withVariables({ file: inputPath('greeting.variables') })
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);
    const job = result.jobs['print_greeting']!;
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
    const job = result.jobs['print_greeting']!;
    expect(job).toHaveStatus(ActExecStatus.SUCCESS);
    expect(job.output).toContain('Hallo, Bruce!');
  });

  test('a later call to withVariables replaces values set by an earlier call', async () => {
    const result = await variablesWorkflowRunner()
      .withVariables({ values: { GREETING: 'Hello', NAME: 'Bruce' } })
      .withVariables({ values: { GREETING: 'Hallo' } })
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);
    const job = result.jobs['print_greeting']!;
    expect(job).toHaveStatus(ActExecStatus.SUCCESS);
    expect(job.output).toContain('Hallo, !');
  });
});
