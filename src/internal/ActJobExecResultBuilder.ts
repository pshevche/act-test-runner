import { ActJobExecResult } from '../ActJobExecResult';
import { ActExecStatus } from '../ActExecStatus';

export class ActJobExecResultBuilder {
  private readonly name: string;
  private hasExecutedSteps: boolean = false;
  private status: ActExecStatus | undefined;
  private readonly outputLines: string[] = [];

  constructor(name: string) {
    this.name = name;
  }

  output(line: string): ActJobExecResultBuilder {
    this.outputLines.push(line);
    return this;
  }

  stepCompleted(): ActJobExecResultBuilder {
    this.hasExecutedSteps = true;
    return this;
  }

  completed(): ActJobExecResultBuilder {
    this.status = this.hasExecutedSteps
      ? ActExecStatus.SUCCESS
      : ActExecStatus.SKIPPED;
    return this;
  }

  failed(): ActJobExecResultBuilder {
    this.status = ActExecStatus.FAILED;
    return this;
  }

  build(): ActJobExecResult {
    return new ActJobExecResult(
      this.name,
      this.status!,
      this.outputLines.join('\n'),
    );
  }
}
