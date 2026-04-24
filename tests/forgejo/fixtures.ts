import { DockerForgejoRunner, ForgejoRunner } from '../../src/index.js';

export function forgejoRunner(
  forwardOutput: boolean = false,
): ForgejoRunner | DockerForgejoRunner {
  const runner = process.env.CI
    ? new ForgejoRunner()
    : new DockerForgejoRunner();
  if (forwardOutput) {
    runner.forwardOutput();
  }
  return runner;
}
