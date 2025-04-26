import { ActJobExecResult } from '../ActJobExecResult';
import { ActJobExecResultBuilder } from './ActJobExecResultBuilder';
import type { ActExecListener } from './ActExecListener';

export class JobTrackingActExecListener implements ActExecListener {
  private readonly execOutput: string[] = [];
  private readonly jobsByName: Map<String, ActJobExecResultBuilder> = new Map<
    String,
    ActJobExecResultBuilder
  >();

  onStdOutput(output: string) {
    this.onStdOutputOrError(output);
  }

  onStdError(output: string) {
    this.onStdOutputOrError(output);
  }

  private onStdOutputOrError(output: string) {
    this.execOutput.push(output.toString());
    this.maybeProcessJobOutput(output.toString());
  }

  private maybeProcessJobOutput(line: string) {
    if (line.startsWith('[')) {
      const jobName = this.extractJobName(line);
      const jobBuilder = this.createOrGetBuilder(jobName);

      jobBuilder.output(line);

      if (line.includes('Success - Main')) {
        jobBuilder.stepCompleted();
      } else if (line.endsWith('Job succeeded')) {
        jobBuilder.completed();
      } else if (line.endsWith('Job failed')) {
        jobBuilder.failed();
      }
    }
  }

  private extractJobName(line: string) {
    const prefixSeparator = line.indexOf('/');
    const prefixEnd = line.indexOf(']');
    return line.substring(prefixSeparator + 1, prefixEnd).trim();
  }

  getOutput(): string {
    return this.execOutput.join('\n');
  }

  getJobs(): Map<String, ActJobExecResult> {
    return new Map(
      Array.from(this.jobsByName).map(([name, jobBuilder]) => [
        name,
        jobBuilder.build(),
      ]),
    );
  }

  private createOrGetBuilder(jobName: string): ActJobExecResultBuilder {
    if (!this.jobsByName.has(jobName)) {
      this.jobsByName.set(jobName, new ActJobExecResultBuilder(jobName));
    }
    return this.jobsByName.get(jobName)!;
  }
}
