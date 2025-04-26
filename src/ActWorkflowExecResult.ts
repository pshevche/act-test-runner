import { ActExecStatus } from './ActExecStatus';
import { ActJobExecResult } from './ActJobExecResult';

export class ActWorkflowExecResult {
  readonly status: ActExecStatus;
  readonly output: string;
  readonly jobs: Map<String, ActJobExecResult>;

  constructor(
    status: ActExecStatus,
    output: string,
    jobs: Map<String, ActJobExecResult>,
  ) {
    this.status = status;
    this.output = output;
    this.jobs = jobs;
  }

  job(name: string): ActJobExecResult | undefined {
    return this.jobs.get(name);
  }
}
