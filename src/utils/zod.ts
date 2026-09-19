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

type MapType<TType> = TType extends 'bool'
  ? z.ZodBoolean
  : TType extends 'int' | 'uint16'
    ? z.ZodNumber
    : TType extends 'string'
      ? z.ZodString
      : TType extends 'stringArray'
        ? z.ZodArray<z.ZodString>
        : never;

const actTypeToZodTypeMap = {
  string: z.string(),
  bool: z.boolean(),
  int: z.number().int(),
  uint16: z.number().int().min(0).max(65535),
  stringArray: z.array(z.string()),
} as const;

/**
 * Converts an object of act CLI params to zod schema.
 *
 * Example:
 *
 * ```ts
 * const actCliParams = {
 *   'action-cache-path': { type: 'string' },
 *   'artifact-server-port': { type: 'string' },
 *   'artifact-server-addr': { type: 'string' },
 *   'action-offline-mode': { type: 'bool' },
 * };
 * const extensions = {
 *   'artifact-server-port': { type: 'uint16' },
 *   'artifact-server-addr': { alias: 'artifact-server-host' },
 * }
 * const schema = actCliParamsToZodSchema(actCliParams, extensions);
 * ```
 *
 * Resulting schema:
 *
 * ```ts
 * z.object({
 *   'action-cache-path': z.string(),
 *   'artifact-server-port': z.number().int().min(0).max(65535),
 *   'artifact-server-host': z.string(),
 *   'action-offline-mode': z.boolean(),
 * });
 * ```
 */
export function actCliParamsToZodSchema<
  TDescriptor extends {
    type: keyof typeof actTypeToZodTypeMap;
    description?: string;
    alias?: string;
  },
  const TOptions extends Record<string, TDescriptor>,
  const TExtensions extends Partial<
    Record<keyof TOptions, Partial<TDescriptor>>
  > = {},
>(options: TOptions, extensions?: TExtensions) {
  const properties = {} as Record<string, z.ZodType>;

  for (const [name, params] of Object.entries(options)) {
    const alias = extensions?.[name]?.alias;
    const type = extensions?.[name]?.type ?? params.type;
    properties[alias ?? name] = actTypeToZodTypeMap[type];
  }

  return z.object(
    properties as {
      [
        Key in keyof TOptions as Key extends keyof TExtensions
          ? TExtensions[Key] extends { alias: infer TAlias extends string }
            ? TAlias
            : Key
          : Key
      ]: MapType<
        TExtensions[Key] extends { type: infer TType extends string }
          ? TType
          : TOptions[Key]['type']
      >;
    },
  );
}
