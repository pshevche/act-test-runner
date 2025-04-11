import { expect, test } from 'bun:test';
import { runner, workflowPath } from './fixtures';

test('fails if the specified workflows location does not exist', async () => {
  expect(
    async () => await runner().withWorkflowFile('non-existing').run(),
  ).toThrow("The specified workflow path 'non-existing' does not exist");
});

test('fails if the specified working directory does not exist', async () => {
  expect(
    async () => await runner().withWorkingDir('non-existing').run(),
  ).toThrow("The specified working directory 'non-existing' does not exist");
});

test('fails if both the workflow file and workflow body are specified', async () => {
  expect(async () =>
    runner().withWorkflowFile('file').withWorkflowBody('body').run(),
  ).toThrow("Expected one value out of 'file' and 'body' to be defined");
});

test('either workflow file or body is required', async () => {
  expect(async () => await runner().run()).toThrow(
    "Expected one value out of 'undefined' and 'undefined' to be defined",
  );
});

test('fails if provided env file does not exist', async () => {
  expect(
    async () =>
      await runner()
        .withWorkflowFile(workflowPath('always_passing_workflow'))
        .withEnvFile('non-existing')
        .run(),
  ).toThrow("The specified env values file 'non-existing' does not exist");
});

test('fails if provided input values file does not exist', async () => {
  expect(
    async () =>
      await runner()
        .withWorkflowFile(workflowPath('always_passing_workflow'))
        .withInputFile('non-existing')
        .run(),
  ).toThrow("The specified input values file 'non-existing' does not exist");
});

test('fails if provided event payload file does not exist', async () => {
  expect(
    async () =>
      await runner()
        .withWorkflowFile(workflowPath('always_passing_workflow'))
        .withEvent('push', 'non-existing')
        .run(),
  ).toThrow("The specified event payload file 'non-existing' does not exist");
});

test('fails if provided secrets values file does not exist', async () => {
  expect(
    async () =>
      await runner()
        .withWorkflowFile(workflowPath('always_passing_workflow'))
        .withSecretsFile('non-existing')
        .run(),
  ).toThrow("The specified secrets values file 'non-existing' does not exist");
});

test('fails if provided variables values file does not exist', async () => {
  expect(
    async () =>
      await runner()
        .withWorkflowFile(workflowPath('always_passing_workflow'))
        .withVariablesFile('non-existing')
        .run(),
  ).toThrow(
    "The specified variables values file 'non-existing' does not exist",
  );
});
