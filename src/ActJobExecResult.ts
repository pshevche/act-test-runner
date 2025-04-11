import { ActExecStatus } from './ActExecStatus.ts';

export class ActJobExecResult {
  name: string;
  status: ActExecStatus;
  output: string;

  constructor(name: string, status: ActExecStatus, output: string) {
    this.name = name;
    this.status = status;
    this.output = output;
  }
}
