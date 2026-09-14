import { getResponse, http, HttpResponse } from 'msw';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

import { ActExecStatus } from '../src/index.js';
import { runner, workflowPath } from './fixtures.js';

/*
 * Demonstrates how to serve a mocked GitHub API to the workflow under test.
 *
 * The workflow steps run inside a container, so `setupServer` from `msw/node`
 * is of no use here: it only intercepts requests made from the current
 * process. Instead, the handlers are served over an HTTP server the container
 * can call, and the workflow is pointed at it by overriding `GITHUB_API_URL`,
 * which `act` otherwise sets to `https://api.github.com`.
 */

const MOCK_API_PORT = 9_999;
// `host.docker.internal` resolves to the host from within the job container
const MOCK_API_URL = `http://host.docker.internal:${MOCK_API_PORT}`;

const handlers = [
  http.get('*/users/:username', ({ params }) =>
    HttpResponse.json({ login: params['username'], id: 12_345_678 }),
  ),
];

const mockGitHubApi = createServer(async (req, res) => {
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
  });
  const response = await getResponse(handlers, request);

  res.writeHead(
    response?.status ?? 404,
    Object.fromEntries(response?.headers ?? []),
  );
  res.end(await response?.text());
});

// The mock server's lifecycle is the test's responsibility: the runner only
// manages the workflow execution itself.
beforeAll(async () => {
  mockGitHubApi.listen(MOCK_API_PORT);
  await once(mockGitHubApi, 'listening');
});

afterAll(async () => {
  mockGitHubApi.close();
  await once(mockGitHubApi, 'close');
});

describe('GitHub API mock', () => {
  test('workflow consumes responses served by the mock server', async () => {
    const result = await runner()
      .withWorkflow({ file: workflowPath('print_github_user_id') })
      .withEnvs({ values: { GITHUB_API_URL: MOCK_API_URL } })
      // makes the host reachable as `host.docker.internal` from the job container
      .withAdditionalArgs(
        '--container-options',
        '--add-host=host.docker.internal:host-gateway',
      )
      .run();

    expect(result).toHaveStatus(ActExecStatus.SUCCESS);

    const job = result.jobs['print_github_user_id']!;
    expect(job).toHaveStatus(ActExecStatus.SUCCESS);
    expect(job.output).toContain('User ID: 12345678');
  });
});
