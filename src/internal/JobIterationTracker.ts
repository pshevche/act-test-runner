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

import { ActMatrixValues } from '../ActRunnerResult.js';

export class JobIterationTracker {
  private readonly matrixIdx: Map<string, number> = new Map<string, number>();

  private matrixKey(matrix: ActMatrixValues): string {
    return Object.entries(matrix)
      .map((value) => `${value[0]}\u0000${value[1]}`)
      .sort((a, b) => (a > b ? 1 : -1))
      .reduce((prev, curr) => `${prev}\u0000${curr}`);
  }

  iterationIndex(matrix: ActMatrixValues): number {
    const key = this.matrixKey(matrix);
    if (this.matrixIdx.has(key)) {
      return this.matrixIdx.get(key)!;
    } else {
      const newIterationIndex = this.matrixIdx.size + 1;
      this.matrixIdx.set(key, newIterationIndex);
      return newIterationIndex;
    }
  }
}
