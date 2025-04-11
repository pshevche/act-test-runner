export function firstDefined<T>(
  first: () => T | undefined,
  second: () => T,
): T {
  const firstValue = first();
  return firstValue !== undefined ? firstValue : second();
}
