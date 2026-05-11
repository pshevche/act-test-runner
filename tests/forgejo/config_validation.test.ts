import { workflowPath } from '../fixtures.js';
import { forgejoRunner } from './fixtures.js';

test('fails if the specified workflows location does not exist', async () => {
  await expect(
    forgejoRunner().withWorkflowFile('non-existing').run(),
  ).rejects.toThrow(
    "The specified workflow path 'non-existing' does not exist",
  );
});

test('fails if the specified working directory does not exist', async () => {
  await expect(
    forgejoRunner().withWorkingDir('non-existing').run(),
  ).rejects.toThrow(
    "The specified working directory 'non-existing' does not exist",
  );
});

test('fails if both the workflow file and workflow body are specified', async () => {
  await expect(
    forgejoRunner().withWorkflowFile('file').withWorkflowBody('body').run(),
  ).rejects.toThrow(
    "Expected one value out of 'file' and 'body' to be defined",
  );
});

test('either workflow file or body is required', async () => {
  await expect(forgejoRunner().run()).rejects.toThrow(
    "Expected one value out of 'undefined' and 'undefined' to be defined",
  );
});

test('fails if provided env file does not exist', async () => {
  await expect(
    forgejoRunner()
      .withWorkflowFile(workflowPath('always_passing_workflow'))
      .withEnvFile('non-existing')
      .run(),
  ).rejects.toThrow(
    "The specified env values file 'non-existing' does not exist",
  );
});
