import { ActExecStatus } from './ActExecStatus';

export class ActExecResult {
  status: ActExecStatus;
  output: string;

  constructor(status: ActExecStatus, output: string) {
    this.status = status;
    this.output = output;
  }
}
