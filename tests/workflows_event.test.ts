import { expect, test } from 'bun:test';
import { eventPayloadPath, runner, workflowPath } from './fixtures';
import { ActExecStatus, ActRunner } from '../src';

function eventWorkflowRunner(): ActRunner {
  return runner().withWorkflowFile(workflowPath('print_issue_or_pr_title'));
}

test('uses the first event type lexicographically from workflow if no event type is set', async () => {
  const result = await eventWorkflowRunner().run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);

  const issueJob = result.job('print_issue_title')!;
  expect(issueJob.status).toBe(ActExecStatus.SUCCESS);

  const prJob = result.job('print_pr_title')!;
  expect(prJob.status).toBe(ActExecStatus.SKIPPED);
});

test('allows configuring the event type to trigger the workflow with', async () => {
  const result = await eventWorkflowRunner().withEvent('pull_request').run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);

  const issueJob = result.job('print_issue_title')!;
  expect(issueJob.status).toBe(ActExecStatus.SKIPPED);

  const prJob = result.job('print_pr_title')!;
  expect(prJob.status).toBe(ActExecStatus.SUCCESS);
});

test('allows configuring event payload', async () => {
  const result = await eventWorkflowRunner()
    .withEvent('pull_request', eventPayloadPath('pull_request_payload'))
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);

  const issueJob = result.job('print_issue_title')!;
  expect(issueJob.status).toBe(ActExecStatus.SKIPPED);

  const prJob = result.job('print_pr_title')!;
  expect(prJob.status).toBe(ActExecStatus.SUCCESS);
  expect(prJob.output).toContain('PR Title: Example PR payload');
});
