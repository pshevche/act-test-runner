import { test, expect, beforeEach, afterEach } from 'vitest';
import { ActExecStatus, ActWorkflowExecResult } from '../src/index.js';
import { runner, workflowPath } from './fixtures.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

export async function run(executable: string): Promise<ActWorkflowExecResult> {
  return runner()
    .withActExecutable(executable)
    .withWorkflowFile(workflowPath('always_passing_workflow'))
    .run();
}

const customExecDir = join(tmpdir(), 'actTestRunner', 'custom_executable');
beforeEach(() => {
  if (!existsSync(customExecDir)) {
    mkdirSync(customExecDir, { recursive: true });
  }
});

afterEach(() => {
  if (existsSync(customExecDir)) {
    rmSync(customExecDir, { recursive: true, force: true });
  }
});

test('fails if the supplied custom executable does not exist', async () => {
  await expect(run('non-existing')).rejects.toThrow(
    "The specified act executable 'non-existing' does not exist",
  );
});

test('rejects with a clear error if the supplied executable cannot be launched', async () => {
  // a directory exists on disk but can never be spawned as a process
  await expect(run(customExecDir)).rejects.toThrow(/Failed to launch act/);
});

test('runs workflow files with the supplied custom executable', async () => {
  const customExec = join(customExecDir, 'customAct');
  writeFileSync(
    customExec,
    `#!/usr/bin/env bash
    echo "Hello from custom act exec!"
  `,
    { mode: 0o744 },
  );
  const result = await run(customExec);

  expect(result).toHaveStatus(ActExecStatus.SUCCESS);
  expect(result.output).toContain('Hello from custom act exec');
});

test('rejects if run() is called more than once on the same instance', async () => {
  const customExec = join(customExecDir, 'customAct');
  writeFileSync(
    customExec,
    `#!/usr/bin/env bash
    echo "Hello from custom act exec!"
  `,
    { mode: 0o744 },
  );
  const testRunner = runner()
    .withActExecutable(customExec)
    .withWorkflowFile(workflowPath('always_passing_workflow'));

  await testRunner.run();

  await expect(testRunner.run()).rejects.toThrow(
    'ActRunner instances cannot be reused; create a new instance for each run()',
  );
});
