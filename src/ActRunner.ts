import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { ActWorkflowExecResult } from './ActWorkflowExecResult.ts';
import { ActExecStatus } from './ActExecStatus.ts';
import { ActRunnerError } from './ActRunnerError.ts';
import { JobTrackingActExecListener } from './internal/JobTrackingActExecListener.ts';
import { OutputForwardingActExecListener } from './internal/OutputForwardingActExecListener.ts';

export class ActRunner {
  private workflowFile!: string;
  private shouldForwardOutput: boolean = false;

  withWorkflowFile(workflowsPath: string): ActRunner {
    this.workflowFile = workflowsPath;
    return this;
  }

  forwardOutput(): ActRunner {
    this.shouldForwardOutput = true;
    return this;
  }

  run(): Promise<ActWorkflowExecResult> {
    return new Promise<ActWorkflowExecResult>((resolve, reject) => {
      const paramsOrError = this.validateRunnerParams();
      if (paramsOrError instanceof ActRunnerError) {
        reject(paramsOrError as ActRunnerError);
      }

      const executionListener = this.shouldForwardOutput
        ? new OutputForwardingActExecListener(new JobTrackingActExecListener())
        : new JobTrackingActExecListener();
      const process = spawn(
        'act',
        (paramsOrError as ActRunnerParams).asCliArgs(),
      );
      process.stdout.on('data', (data) =>
        executionListener.onStdOutput(data.toString().trimEnd()),
      );
      process.stderr.on('data', (data) =>
        executionListener.onStdError(data.toString().trimEnd()),
      );

      process.on('close', (code) =>
        resolve(
          new ActWorkflowExecResult(
            code === 0 ? ActExecStatus.SUCCESS : ActExecStatus.FAILED,
            executionListener.getOutput(),
            executionListener.getJobs(),
          ),
        ),
      );
    });
  }

  private validateRunnerParams(): ActRunnerParams | ActRunnerError {
    if (!fs.existsSync(this.workflowFile)) {
      return new ActRunnerError(
        `The specified workflows path '${this.workflowFile}' does not exist`,
      );
    }

    return new ActRunnerParams(this.workflowFile);
  }
}

class ActRunnerParams {
  workflowsPath: string;

  constructor(workflowsPath: string) {
    this.workflowsPath = workflowsPath;
  }

  asCliArgs(): string[] {
    return ['--workflows', this.workflowsPath];
  }
}
