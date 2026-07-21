import { version } from 'typescript';
import { EOL } from 'node:os';

/**
 * Prints an informational banner at the beginning of each test run,
 * indicating the TypeScript version being used.
 *
 * Example:
 * -----------------------------------------------
 *     Running tests against TypeScript v5.9.3
 * -----------------------------------------------
 */
export function setup() {
  const indent = '\x20'.repeat(4);
  const message = `${indent}Running tests against TypeScript v${version}${indent}`;
  const border = '-'.repeat(message.length);
  console.log([border, message, border, EOL].join(EOL));
}
