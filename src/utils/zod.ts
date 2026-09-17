/**
 * Copyright (c) 2026 original authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { z } from 'zod';

// Convert a union type to an intersection type
// (copied from https://github.com/sindresorhus/type-fest/blob/main/source/union-to-intersection.d.ts)
export type UnionToIntersection<Union> = (
  Union extends unknown ? (distributedUnion: Union) => void : never
) extends (mergedIntersection: infer Intersection) => void
  ? Intersection & Union
  : never;

type MapType<TType> = TType extends 'bool'
  ? z.ZodBoolean
  : TType extends 'int' | 'uint16'
    ? z.ZodNumber
    : TType extends 'string'
      ? z.ZodString
      : TType extends 'stringArray'
        ? z.ZodArray<z.ZodString>
        : never;

type ElementToObj<E> = E extends {
  name: infer TName;
  type: infer TType;
  description?: string;
}
  ? { [name in Extract<TName, string>]: MapType<TType> }
  : never;

const actTypeToZodTypeMap = {
  string: z.string(),
  bool: z.boolean(),
  int: z.number().int(),
  uint16: z.number().int().min(0).max(65535),
  stringArray: z.array(z.string()),
} as const;

/**
 * Converts a list of act CLI params to zod schema.
 *
 * Example:
 *
 * ```ts
 * const actCliParams = [
 *   { name: 'action-cache-path', type: 'string' },
 *   { name: 'action-offline-mode', type: 'bool' },
 * ];
 * const schema = actCliParamsToZodSchema(actCliParams);
 * ```
 *
 * Resulting schema:
 *
 * ```ts
 * z.object({
 *   'action-cache-path': z.string(),
 *   'action-offline-mode': z.boolean,
 * })
 * ```
 */
export function actCliParamsToZodSchema<
  T extends ReadonlyArray<{
    name: string;
    type: keyof typeof actTypeToZodTypeMap;
    description?: string;
  }>,
>(options: T) {
  const properties: Record<string, z.ZodType> = {};

  for (const item of options) {
    if (item.name === 'artifact-server-port') {
      /**
       * For some reason cache server and artifact server `port` properties have
       * different types. Cache server port is typed as `number` and artifact
       * server port - as `string`. To keep things consistent we change artifact
       * server port type to also be a `number`.
       */
      properties[item.name] = z.number();
    } else {
      properties[item.name] = actTypeToZodTypeMap[item.type];
    }
  }

  return z.object(
    properties as Omit<
      UnionToIntersection<ElementToObj<T[number]>>,
      'artifact-server-port'
    > & { 'artifact-server-port': z.ZodNumber },
  );
}
