import { ActJobExecResult } from '../ActJobExecResult';
import { ActExecStatus } from '../ActExecStatus';

export class ActJobExecResultBuilder {
  name: string;
  status: ActExecStatus | undefined;
  outputLines: string[] = [];

  constructor(name: string) {
    this.name = name;
  }

  output(line: string): ActJobExecResultBuilder {
    this.outputLines.push(line);
    return this;
  }

  succeeded(): ActJobExecResultBuilder {
    this.status = ActExecStatus.SUCCESS;
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
