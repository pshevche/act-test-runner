import { inputPath, runner, workflowPath } from './fixtures.js';
import { ActExecStatus, ActRunner } from '../src/index.js';

function inputWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('print_inputs'));
}

test('supports setting input values directly', async () => {
  const result = await inputWorkflowRunner()
    .withInputsValues(['greeting', 'Hello'], ['name', 'Bruce'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});

test('supports setting input values from file', async () => {
  const result = await inputWorkflowRunner()
    .withInputsFile(inputPath('greeting.input'))
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hallo, Falco!');
});
