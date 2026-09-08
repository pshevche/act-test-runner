import { describe, test, expect } from 'vitest';
import { runner, workflowPath } from './fixtures.js';
import { ActWorkflowSource } from '../src/index.js';

describe('config validation', () => {
  test('fails if the specified workflows location does not exist', async () => {
    await expect(
      runner().withWorkflow({ file: 'non-existing' }).run(),
    ).rejects.toThrow(
      "The specified workflow path 'non-existing' does not exist",
    );
  });

  test('fails if the specified working directory does not exist', async () => {
    await expect(runner().withWorkingDir('non-existing').run()).rejects.toThrow(
      "The specified working directory 'non-existing' does not exist",
    );
  });

  test('fails if both the workflow file and workflow body are specified', async () => {
    // bypasses the type system to exercise the runtime guard for untyped (e.g. plain JS) callers
    const bothSpecified = {
      file: 'file',
      body: 'body',
    } as unknown as ActWorkflowSource;

    await expect(runner().withWorkflow(bothSpecified).run()).rejects.toThrow(
      "Expected one value out of 'file' and 'body' to be defined",
    );
  });

  test('either workflow file or body is required', async () => {
    await expect(runner().run()).rejects.toThrow(
      "Expected one value out of 'undefined' and 'undefined' to be defined",
    );
  });

  test('fails if provided env file does not exist', async () => {
    await expect(
      runner()
        .withWorkflow({ file: workflowPath('always_passing_workflow') })
        .withEnv({ file: 'non-existing' })
        .run(),
    ).rejects.toThrow(
      "The specified env values file 'non-existing' does not exist",
    );
  });

  test('fails if provided input values file does not exist', async () => {
    await expect(
      runner()
        .withWorkflow({ file: workflowPath('always_passing_workflow') })
        .withInputs({ file: 'non-existing' })
        .run(),
    ).rejects.toThrow(
      "The specified input values file 'non-existing' does not exist",
    );
  });

  test('fails if provided event payload file does not exist', async () => {
    await expect(
      runner()
        .withWorkflow({ file: workflowPath('always_passing_workflow') })
        .withEvent('push', 'non-existing')
        .run(),
    ).rejects.toThrow(
      "The specified event payload file 'non-existing' does not exist",
    );
  });

  test('fails if provided secrets values file does not exist', async () => {
    await expect(
      runner()
        .withWorkflow({ file: workflowPath('always_passing_workflow') })
        .withSecrets({ file: 'non-existing' })
        .run(),
    ).rejects.toThrow(
      "The specified secrets values file 'non-existing' does not exist",
    );
  });

  test('fails if provided variables values file does not exist', async () => {
    await expect(
      runner()
        .withWorkflow({ file: workflowPath('always_passing_workflow') })
        .withVariables({ file: 'non-existing' })
        .run(),
    ).rejects.toThrow(
      "The specified variables values file 'non-existing' does not exist",
    );
  });

  test('fails if additional arguments contain managed params', async () => {
    await expect(
      runner()
        .withWorkflow({ file: workflowPath('always_passing_workflow') })
        .withAdditionalArgs(
          '--detect-event',
          '--input-file',
          'irrelevant',
          '--list',
        )
        .run(),
    ).rejects.toThrow(
      "The following act arguments must be set via dedicated ActRunner methods, and not via 'withAdditionalArguments': --detect-event,--input-file",
    );
  });

  test('fails if additional arguments contain internal params', async () => {
    await expect(
      runner()
        .withWorkflow({ file: workflowPath('always_passing_workflow') })
        .withAdditionalArgs('--rm')
        .run(),
    ).rejects.toThrow(
      "The following act arguments must not be set via 'withAdditionalArguments', as they are managed by the ActRunner: --rm",
    );
  });
});
