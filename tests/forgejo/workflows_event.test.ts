import { forgejoWorkflowPath } from '../fixtures.js';
import { forgejoRunner } from './fixtures.js';
import { ActExecStatus } from '../../src/index.js';

function eventWorkflowRunner() {
  return forgejoRunner().withWorkflowFile(
    forgejoWorkflowPath('print_issue_or_pr_title'),
  );
}

test('uses the first event type lexicographically from workflow if no event type is set', async () => {
  const result = await eventWorkflowRunner()
    .withAdditionalArgs('--debug')
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);

  const issueJob = result.job('print_issue_title')!;
  expect(result.output).toContain('bla');
  expect(issueJob.status).toBe(ActExecStatus.SUCCESS);

  const prJob = result.job('print_pr_title')!;
  expect(prJob.status).toBe(ActExecStatus.SKIPPED);
});

test('allows configuring the event type to trigger the workflow with', async () => {
  const result = await eventWorkflowRunner()
    .withAdditionalArgs('--debug')
    .withEvent('pull_request')
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);

  const issueJob = result.job('print_issue_title')!;
  expect(result.output).toContain('bla');
  expect(issueJob.status).toBe(ActExecStatus.SKIPPED);

  const prJob = result.job('print_pr_title')!;
  expect(prJob.status).toBe(ActExecStatus.SUCCESS);
});
