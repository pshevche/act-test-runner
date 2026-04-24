import { ForgejoRunner } from '../../src/index.js';

export function forgejoRunner(forwardOutput: boolean = false): ForgejoRunner {
  const runner = new ForgejoRunner();
  if (forwardOutput) {
    runner.forwardOutput();
  }
  return runner;
}
