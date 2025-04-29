import { runner, workflowPath } from './fixtures.js';

test('fails if the specified workflows location does not exist', async () => {
  await expect(runner().withWorkflowFile('non-existing').run()).rejects.toThrow(
    "The specified workflow path 'non-existing' does not exist",
  );
});

test('fails if the specified working directory does not exist', async () => {
  await expect(runner().withWorkingDir('non-existing').run()).rejects.toThrow(
    "The specified working directory 'non-existing' does not exist",
  );
});

test('fails if both the workflow file and workflow body are specified', async () => {
  await expect(
    runner().withWorkflowFile('file').withWorkflowBody('body').run(),
  ).rejects.toThrow(
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
      .withWorkflowFile(workflowPath('always_passing_workflow'))
      .withEnvFile('non-existing')
      .run(),
  ).rejects.toThrow(
    "The specified env values file 'non-existing' does not exist",
  );
});

test('fails if provided input values file does not exist', async () => {
  await expect(
    runner()
      .withWorkflowFile(workflowPath('always_passing_workflow'))
      .withInputsFile('non-existing')
      .run(),
  ).rejects.toThrow(
    "The specified input values file 'non-existing' does not exist",
  );
});

test('fails if provided event payload file does not exist', async () => {
  await expect(
    runner()
      .withWorkflowFile(workflowPath('always_passing_workflow'))
      .withEvent('push', 'non-existing')
      .run(),
  ).rejects.toThrow(
    "The specified event payload file 'non-existing' does not exist",
  );
});

test('fails if provided secrets values file does not exist', async () => {
  await expect(
    runner()
      .withWorkflowFile(workflowPath('always_passing_workflow'))
      .withSecretsFile('non-existing')
      .run(),
  ).rejects.toThrow(
    "The specified secrets values file 'non-existing' does not exist",
  );
});

test('fails if provided variables values file does not exist', async () => {
  await expect(
    runner()
      .withWorkflowFile(workflowPath('always_passing_workflow'))
      .withVariablesFile('non-existing')
      .run(),
  ).rejects.toThrow(
    "The specified variables values file 'non-existing' does not exist",
  );
});
