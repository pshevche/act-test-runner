import { ActRunner } from '../../src/index.js';

export function actRunner(): ActRunner {
  return new ActRunner().forwardOutput();
}
