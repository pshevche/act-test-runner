import type { ActExecListener } from './ActExecListener';
import type { ActJobExecResult } from '../ActJobExecResult';

export class OutputForwardingActExecListener implements ActExecListener {
  private readonly delegate: ActExecListener;

  constructor(delegate: ActExecListener) {
    this.delegate = delegate;
  }

  onStdOutput(output: string) {
    console.log(output);
    this.delegate.onStdOutput(output);
  }

  onStdError(output: string) {
    console.error(output);
    this.delegate.onStdError(output);
  }

  getOutput(): string {
    return this.delegate.getOutput();
  }

  getJobs(): Map<String, ActJobExecResult> {
    return this.delegate.getJobs();
  }
}
