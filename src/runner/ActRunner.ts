import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { ActExecResult } from './ActExecResult';
import { ActExecStatus } from './ActExecStatus';
import { ActRunnerError } from './ActRunnerError';

export class ActRunner {
  workflowsPath!: string;

  withWorkflowsPath(workflowsPath: string): ActRunner {
    this.workflowsPath = workflowsPath;
    return this;
  }

  run(): Promise<ActExecResult> {
    return new Promise<ActExecResult>((resolve, reject) => {
      const paramsOrError = this.validateRunnerParams();
      if (paramsOrError instanceof ActRunnerError) {
        reject(paramsOrError as ActRunnerError);
      }

      const process = spawn(
        'act',
        (paramsOrError as ActRunnerParams).asCliArgs(),
      );
      let lines: string[] = [];

      process.stdout.on('data', (data) => lines.push(data));
      process.stderr.on('data', (data) => lines.push(data));

      process.on('close', (code) =>
        resolve(
          new ActExecResult(
            code === 0 ? ActExecStatus.SUCCESS : ActExecStatus.FAILED,
            lines.join('\n'),
          ),
        ),
      );
    });
  }

  private validateRunnerParams(): ActRunnerParams | ActRunnerError {
    if (!fs.existsSync(this.workflowsPath)) {
      return new ActRunnerError(
        `The specified workflows path '${this.workflowsPath}' does not exist`,
      );
    }

    return new ActRunnerParams(this.workflowsPath);
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
