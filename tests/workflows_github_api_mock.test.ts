import { getResponse, http, HttpResponse, RequestHandler } from 'msw';
import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse,
} from 'node:http';
import { AddressInfo } from 'node:net';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

import { ActExecStatus } from '../src/index.js';
import { runner, workflowPath } from './fixtures.js';

/*
 * Demonstrates how to serve a mocked GitHub API to the workflow under test.
 *
 * The mock server runs on the host, while the workflow steps run inside a
 * container, so the workflow is pointed at the host by overriding the
 * `GITHUB_API_URL` environment variable, which otherwise defaults to
 * `https://api.github.com`.
 */

const handlers: RequestHandler[] = [
  http.get('*/users/:username', ({ params }) =>
    HttpResponse.json({ login: params['username'], id: 12_345_678 }),
  ),
];

// Translates an incoming Node request into a fetch `Request` msw can match,
// and writes the mocked response (if any) back to the Node response.
async function respondWithMock(req: IncomingMessage, res: ServerResponse) {
  const headers = new Headers();
  Object.entries(req.headersDistinct).forEach(([name, values]) =>
    values?.forEach((value) => headers.append(name, value)),
  );

  const request = new Request(
    new URL(req.url ?? '/', `http://${req.headers.host}`),
    { method: req.method, headers },
  );

  const response = await getResponse(handlers, request);
  if (!response) {
    res.writeHead(404).end();
    return;
  }

  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

// The mock server's lifecycle is the test's responsibility: the runner only
// manages the workflow execution itself.
let mockGitHubApi: Server;

function mockGitHubApiUrl(): string {
  const { port } = mockGitHubApi.address() as AddressInfo;
  // `host.docker.internal` resolves to the host from within the job container
  return `http://host.docker.internal:${port}`;
}

beforeAll(async () => {
  mockGitHubApi = await new Promise<Server>((resolve) => {
    const server = createServer(respondWithMock).listen(0, () =>
      resolve(server),
    );
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    mockGitHubApi.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('GitHub API mock', () => {
  test('workflow consumes responses served by the mock server', async () => {
    const result = await runner()
      .withWorkflow({ file: workflowPath('print_github_user_id') })
      .withEnv({ values: { GITHUB_API_URL: mockGitHubApiUrl() } })
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
