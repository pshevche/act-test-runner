import { ActExecStatus } from './ActExecStatus.ts';

export class ActJobExecResult {
  readonly name: string;
  readonly status: ActExecStatus;
  readonly output: string;

  constructor(name: string, status: ActExecStatus, output: string) {
    this.name = name;
    this.status = status;
    this.output = output;
  }
}
