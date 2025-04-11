import { ActExecStatus } from './ActExecStatus.ts';
import { ActJobExecResult } from './ActJobExecResult.ts';

export class ActWorkflowExecResult {
  status: ActExecStatus;
  output: string;
  jobs: Map<String, ActJobExecResult>;

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
