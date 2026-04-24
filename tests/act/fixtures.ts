import { ActRunner } from '../../src/index.js';

export function actRunner(forwardOutput: boolean = false): ActRunner {
  const runner = new ActRunner();
  if (forwardOutput) {
    runner.forwardOutput();
  }
  return runner;
}
