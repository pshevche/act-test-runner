import { ActJobExecResult } from '../ActJobExecResult';

export interface ActExecListener {
  onStdOutput(output: string): void;

  onStdError(output: string): void;

  getOutput(): string;

  getJobs(): Map<String, ActJobExecResult>;
}
