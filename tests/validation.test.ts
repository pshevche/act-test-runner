import { expect, test } from 'bun:test';
import { runner } from './fixtures';

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
