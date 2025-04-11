import path from 'node:path';
import { ActRunner } from '../src';

export function runner(forwardOutput: boolean = false): ActRunner {
  const runner = new ActRunner();
  if (forwardOutput) {
    runner.forwardOutput();
  }
  return runner;
}

export function workflowPath(workflowName: string): string {
  return path.resolve(
    import.meta.dirname,
    `resources/workflows/${workflowName}.yml`,
  );
}
