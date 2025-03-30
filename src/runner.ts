import { spawn } from 'node:child_process';

export class ActRunner {
  run(): Promise<ActExecResult> {
    return new Promise<ActExecResult>((resolve) => {
      const process = spawn('act', ['--help']);
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
}

export enum ActExecStatus {
  FAILED,
  SUCCESS,
}

export class ActExecResult {
  status: ActExecStatus;
  output: string;

  constructor(status: ActExecStatus, output: string) {
    this.status = status;
    this.output = output;
  }
}
