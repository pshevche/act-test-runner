import { ForgejoRunner } from '../../src/index.js';

export function forgejoRunner(): ForgejoRunner {
  return new ForgejoRunner().forwardOutput();
}
