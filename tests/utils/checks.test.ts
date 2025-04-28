import { checkExists, checkOneDefined } from '../../src/utils/checks.js';
import { currentDir } from '../fixtures.js';

describe('checkOneDefined', () => {
  test('does not fail if first value is defined', () => {
    expect(() => checkOneDefined('foo', undefined)).not.toThrow();
  });

  test('does not fail if second value is defined', () => {
    expect(() => checkOneDefined(undefined, 'bar')).not.toThrow();
  });

  test('throws if both values are defined', () => {
    expect(() => checkOneDefined('foo', 'bar')).toThrow(
      "Expected one value out of 'foo' and 'bar' to be defined",
    );
  });

  test('throws if both values are defined', () => {
    expect(() => checkOneDefined(undefined, undefined)).toThrow(
      "Expected one value out of 'undefined' and 'undefined' to be defined",
    );
  });
});

describe('checkExists', () => {
  test('throws if path does not exist', () => {
    expect(() => checkExists('foo path', 'foo')).toThrow(
      "The specified foo path 'foo' does not exist",
    );
  });

  test('returns provided path if it exists', () => {
    const dir = currentDir();
    expect(checkExists('current dir', dir)).toBe(dir);
  });
});
