import { describe, expect, test } from 'bun:test';
import { firstDefined } from '../../src/utils/objects';

describe('firstDefined', () => {
  test('returns first value if provided supplier returns a value', () => {
    expect(
      firstDefined(
        () => 'foo',
        () => 'bar',
      ),
    ).toBe('foo');
  });

  test('returns second value if first supplier returns no value', () => {
    expect(
      firstDefined(
        () => undefined,
        () => 'bar',
      ),
    ).toBe('bar');
  });

  test('evaluates the second supplier only if the first one has no value', () => {
    expect(() =>
      firstDefined(
        () => 'foo',
        () => {
          throw Error('boom!');
        },
      ),
    ).not.toThrow();
  });
});
