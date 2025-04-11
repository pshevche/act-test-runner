import { spawn } from 'node:child_process';
import { ActWorkflowExecResult } from './ActWorkflowExecResult.ts';
import { ActExecStatus } from './ActExecStatus.ts';
import { ActRunnerError } from './ActRunnerError.ts';
import { JobTrackingActExecListener } from './internal/JobTrackingActExecListener.ts';
import { OutputForwardingActExecListener } from './internal/OutputForwardingActExecListener.ts';
import {
  cleanupDir,
  createTempWorkflowFile,
  createTempDir,
} from './utils/fsutils.ts';
import { firstDefined } from './utils/objects.ts';
import { checkExists, checkOneDefined } from './utils/checks.ts';

export class ActRunner {
  private workflowFile: string | undefined;
  private workingDir: string | undefined;
  private workflowBody: string | undefined;
  private shouldForwardOutput: boolean = false;

  /**
   * Sets the directory to use for the runner's storage needs (default: directory in user's temp folder).
   * @param workingDir - the runner's working directory
   */
  withWorkingDir(workingDir: string): ActRunner {
    this.workingDir = workingDir;
    return this;
  }

  withWorkflowFile(workflowsPath: string): ActRunner {
    this.workflowFile = workflowsPath;
    return this;
  }

  withWorkflowBody(workflowBody: string): ActRunner {
    this.workflowBody = workflowBody;
    return this;
  }

  forwardOutput(): ActRunner {
    this.shouldForwardOutput = true;
    return this;
  }

  run(): Promise<ActWorkflowExecResult> {
    return new Promise<ActWorkflowExecResult>((resolve, reject) => {
      try {
        const params = this.validateRunnerParams();

        const executionListener = this.shouldForwardOutput
          ? new OutputForwardingActExecListener(
              new JobTrackingActExecListener(),
            )
          : new JobTrackingActExecListener();

        const process = spawn('act', (params as ActRunnerParams).asCliArgs());

        process.stdout.on('data', (data) =>
          executionListener.onStdOutput(data.toString().trimEnd()),
        );
        process.stderr.on('data', (data) =>
          executionListener.onStdError(data.toString().trimEnd()),
        );

        process.on('close', (code) => {
          cleanupDir(this.workingDir!);
          resolve(
            new ActWorkflowExecResult(
              code === 0 ? ActExecStatus.SUCCESS : ActExecStatus.FAILED,
              executionListener.getOutput(),
              executionListener.getJobs(),
            ),
          );
        });
      } catch (err) {
        if (err instanceof ActRunnerError) {
          reject(err);
        }
        reject(
          new ActRunnerError(
            `Unexpected error occurred when executing act: ${err}`,
          ),
        );
      }
    });
  }

  private validateRunnerParams(): ActRunnerParams {
    this.workingDir = checkExists(
      'working directory',
      firstDefined(() => this.workingDir, createTempDir),
    );

    checkOneDefined(this.workflowFile, this.workflowBody);
    const workflowFilePath = checkExists(
      'workflow path',
      firstDefined(
        () => this.workflowFile,
        () => createTempWorkflowFile(this.workingDir!, this.workflowBody!),
      ),
    );

    return new ActRunnerParams(workflowFilePath);
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
