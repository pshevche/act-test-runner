import { test, expect, vi, afterEach } from 'vitest';
import {
  ActExecStatus,
  ActOutput,
  ActOutputListener,
  StdStreamOutputListener,
} from '../src/index.js';
import { runner } from './fixtures.js';

class CustomOutputListener implements ActOutputListener {
  workflowLogs: string[] = [];

  onOutput(output: ActOutput): void {
    if (output.job === undefined) {
      this.workflowLogs.push(output.message);
    }
  }

  clear() {
    this.workflowLogs = [];
  }
}

const WORKFLOW_BODY = `
name: Simple passing workflow
on: [push]

jobs:
  successful_job:
    runs-on: ubuntu-latest
    steps:
      - name: Successful step
        run: echo "Hello, World!"
  `;

const consoleMock = vi
  .spyOn(console, 'log')
  .mockImplementation(() => undefined);
const customListener = new CustomOutputListener();

afterEach(() => {
  consoleMock.mockReset();
  customListener.clear();
});

test('does not forward output to console by default', async () => {
  const result = await runner().withWorkflowBody(WORKFLOW_BODY).run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  expect(result.output).toContain('Hello, World!');
  expect(consoleMock).toHaveBeenCalledTimes(0);
});

test('forwards output to console when listener is not provided', async () => {
  const result = await runner()
    .withWorkflowBody(WORKFLOW_BODY)
    .forwardOutput()
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  expect(result.output).toContain('Hello, World!');
  expect(consoleMock).toHaveBeenCalledWith(
    '[Simple passing workflow/successful_job] Hello, World!',
  );
});

test('forwards output to the specified custom listener', async () => {
  const result = await runner()
    .withWorkflowBody(WORKFLOW_BODY)
    .forwardOutput(customListener)
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  expect(result.output).toContain('Hello, World!');
  expect(consoleMock).toHaveBeenCalledTimes(0);
  expect(customListener.workflowLogs.length).toBeGreaterThan(0);
});

test('supports combining multiple listeners', async () => {
  const result = await runner()
    .withWorkflowBody(WORKFLOW_BODY)
    .forwardOutput([customListener, new StdStreamOutputListener()])
    .run();

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  expect(result.output).toContain('Hello, World!');
  expect(consoleMock).toHaveBeenCalledWith(
    '[Simple passing workflow/successful_job] Hello, World!',
  );
  expect(customListener.workflowLogs.length).toBeGreaterThan(0);
});
