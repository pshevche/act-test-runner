import { test, expect } from 'bun:test';
import { ActRunner, ActExecStatus } from '../src';

test('smoke test', async () => {
  const execResult = await new ActRunner().run();
  expect(execResult.status).toBe(ActExecStatus.SUCCESS);
  expect(execResult.output).toContain('Run GitHub actions locally');
});
