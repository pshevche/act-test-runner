/**
 * Copyright (c) 2026 original authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { formattedMessage } from './internal/outputFormatter.js';

/**
 * Message's log level.
 */
export const ActOutputLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

/**
 * Message's log level.
 */
export type ActOutputLevel =
  (typeof ActOutputLevel)[keyof typeof ActOutputLevel];

/**
 * Single message in the act output stream.
 */
export type ActOutput = {
  job?: {
    id: string;
    name: string;
  };
  message: string;
  level: ActOutputLevel;
  time: Date;
};

/**
 * Listen to the act output stream.
 */
export interface ActOutputListener {
  /**
   *
   * @param output act output represented as a structured object.
   */
  onOutput(output: ActOutput): void;
}

/**
 * Act output listener that forwards the output to the console.
 */
export class StdStreamOutputListener implements ActOutputListener {
  onOutput(output: ActOutput): void {
    console.log(formattedMessage(output.message, output.job?.name));
  }
}

/**
 * Composite act output listener that delegates to all provided listeners.
 */
export class CompositeActOutputListener implements ActOutputListener {
  private readonly listeners: ActOutputListener[];

  constructor(listeners: ActOutputListener[]) {
    this.listeners = listeners;
  }

  onOutput(output: ActOutput): void {
    this.listeners.forEach((it) => it.onOutput(output));
  }
}
