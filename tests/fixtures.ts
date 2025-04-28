import path from 'node:path';
import { ActRunner } from '../src/index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export function currentDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

export function runner(forwardOutput: boolean = false): ActRunner {
  const runner = new ActRunner();
  if (forwardOutput) {
    runner.forwardOutput();
  }
  return runner;
}

export function workflowPath(workflowName: string): string {
  return path.resolve(currentDir(), `resources/workflows/${workflowName}.yml`);
}

export function inputPath(inputFileName: string): string {
  return path.resolve(currentDir(), `resources/inputs/${inputFileName}`);
}

export function eventPayloadPath(eventPayloadName: string): string {
  return path.resolve(
    currentDir(),
    `resources/events/${eventPayloadName}.json`,
  );
}
