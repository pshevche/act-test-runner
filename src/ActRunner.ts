import { spawn } from 'node:child_process';
import { ActWorkflowExecResult } from './ActWorkflowExecResult';
import { ActExecStatus } from './ActExecStatus';
import { ActRunnerError } from './ActRunnerError';
import { JobTrackingActExecListener } from './internal/JobTrackingActExecListener';
import { OutputForwardingActExecListener } from './internal/OutputForwardingActExecListener';
import {
  cleanupDir,
  createTempDir,
  createTempWorkflowFile,
} from './utils/fsutils';
import { firstDefined } from './utils/objects';
import { checkExists, checkOneDefined } from './utils/checks';

export class ActRunner {
  private workflowFile: string | undefined;
  private workingDir: string | undefined;
  private workflowBody: string | undefined;
  private eventType: string | undefined;
  private eventPayloadFile: string | undefined;
  private envFile: string | undefined;
  private envValues: Map<String, String> = new Map<String, String>();
  private inputsFile: string | undefined;
  private inputsValues: Map<String, String> = new Map<String, String>();
  private secretsFile: string | undefined;
  private secretsValues: Map<String, String> = new Map<String, String>();
  private variablesFile: string | undefined;
  private variablesValues: Map<String, String> = new Map<String, String>();
  private matrix: Map<String, any> = new Map<String, any>();
  private additionalArgs: string[] = [];
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

  withEvent(
    type: string,
    payloadFile: string | undefined = undefined,
  ): ActRunner {
    this.eventType = type;
    this.eventPayloadFile = payloadFile;
    return this;
  }

  withEnvFile(envFile: string): ActRunner {
    this.envFile = envFile;
    return this;
  }

  withEnvValues(...envValues: [string, string][]): ActRunner {
    envValues.forEach((entry) => this.envValues.set(entry[0], entry[1]));
    return this;
  }

  withInputsFile(inputsFile: string): ActRunner {
    this.inputsFile = inputsFile;
    return this;
  }

  withInputsValues(...inputsValues: [string, string][]): ActRunner {
    inputsValues.forEach((entry) => this.inputsValues.set(entry[0], entry[1]));
    return this;
  }

  withSecretsFile(secretsFile: string): ActRunner {
    this.secretsFile = secretsFile;
    return this;
  }

  withSecretsValues(...secretsValues: [string, string][]): ActRunner {
    secretsValues.forEach((entry) =>
      this.secretsValues.set(entry[0], entry[1]),
    );
    return this;
  }

  withVariablesFile(variablesFile: string): ActRunner {
    this.variablesFile = variablesFile;
    return this;
  }

  withVariablesValues(...variablesValues: [string, string][]): ActRunner {
    variablesValues.forEach((entry) =>
      this.variablesValues.set(entry[0], entry[1]),
    );
    return this;
  }

  withMatrix(...matrixValues: [string, any][]): ActRunner {
    matrixValues.forEach((entry) => this.matrix.set(entry[0], entry[1]));
    return this;
  }

  withAdditionalArgs(...args: string[]): ActRunner {
    args.forEach((arg) => this.additionalArgs.push(arg));
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

    return new ActRunnerParams(
      workflowFilePath,
      this.eventType,
      this.eventPayloadFile,
      this.envFile,
      this.envValues,
      this.inputsFile,
      this.inputsValues,
      this.secretsFile,
      this.secretsValues,
      this.variablesFile,
      this.variablesValues,
      this.matrix,
      this.additionalArgs,
    );
  }
}

class ActRunnerParams {
  private readonly workflowsPath: string;
  private readonly eventType: string | undefined;
  private readonly eventPayloadFile: string | undefined;
  private readonly envFile: string | undefined;
  private readonly envValues: Map<String, String>;
  private readonly inputFile: string | undefined;
  private readonly inputValues: Map<String, String>;
  private readonly secretsFile: string | undefined;
  private readonly secretsValues: Map<String, String>;
  private readonly variablesFile: string | undefined;
  private readonly variablesValues: Map<String, String>;
  private readonly matrix: Map<String, any>;
  private readonly additionalArgs: string[];

  constructor(
    workflowsPath: string,
    eventType: string | undefined,
    eventPayloadFile: string | undefined,
    envFile: string | undefined,
    envValues: Map<String, String>,
    inputFile: string | undefined,
    inputValues: Map<String, String>,
    secretsFile: string | undefined,
    secretsValues: Map<String, String>,
    variablesFile: string | undefined,
    variablesValues: Map<String, String>,
    matrix: Map<String, any>,
    additionalArgs: string[],
  ) {
    this.workflowsPath = workflowsPath;
    this.eventType = eventType;
    this.eventPayloadFile = eventPayloadFile;
    this.envFile = envFile;
    this.envValues = envValues;
    this.inputFile = inputFile;
    this.inputValues = inputValues;
    this.secretsFile = secretsFile;
    this.secretsValues = secretsValues;
    this.variablesFile = variablesFile;
    this.variablesValues = variablesValues;
    this.matrix = matrix;
    this.additionalArgs = additionalArgs;
  }

  asCliArgs(): string[] {
    const args = ['--workflows', this.workflowsPath];

    this.addEvent(args, this.eventType, this.eventPayloadFile);

    this.addInputs(
      args,
      '--env-file',
      this.envFile,
      'env values file',
      '--env',
      this.envValues,
    );

    this.addInputs(
      args,
      '--input-file',
      this.inputFile,
      'input values file',
      '--input',
      this.inputValues,
    );

    this.addInputs(
      args,
      '--secret-file',
      this.secretsFile,
      'secrets values file',
      '--secret',
      this.secretsValues,
    );

    this.addInputs(
      args,
      '--var-file',
      this.variablesFile,
      'variables values file',
      '--var',
      this.variablesValues,
    );

    this.matrix.forEach((value, key) => {
      args.push('--matrix');
      args.push(`${key}:${value}`);
    });
    this.additionalArgs.forEach((arg) => args.push(arg));

    return args;
  }

  private addEvent(
    args: string[],
    eventType: string | undefined,
    eventPayloadFile: string | undefined,
  ) {
    args.push(
      firstDefined(
        () => eventType,
        () => '--detect-event',
      ),
    );
    if (eventPayloadFile !== undefined) {
      checkExists('event payload file', eventPayloadFile);
      args.push('--eventpath', eventPayloadFile);
    }
  }

  private addInputs(
    args: string[],
    fileArg: string,
    file: string | undefined,
    fileLabel: string,
    valuesArg: string,
    values: Map<String, String>,
  ) {
    if (file !== undefined) {
      checkExists(fileLabel, file);
      args.push(fileArg, file);
    }

    if (values.size > 0) {
      values.forEach((value, key) => {
        args.push(valuesArg, `${key}=${value}`);
      });
    }
  }
}
