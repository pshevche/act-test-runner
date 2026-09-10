# act-test-runner

[![Build](https://github.com/pshevche/act-test-runner/actions/workflows/verify.yaml/badge.svg)](https://github.com/pshevche/act-test-runner/actions/workflows/verify.yaml)

**Convenient wrapper around [act](https://github.com/nektos/act) for implementing e2e tests for GitHub actions**

The library defines an opinionated runner interface for executing GitHub workflows locally using
the [act](https://github.com/nektos/act) runner.

Consumers can assert on the outcome of the workflow execution, such as the jobs run, workflow's output, or artifacts
persisted in the artifact server or action cache.

## Sneak preview

```JavaScript
test('custom workflow with event', async () => {
  const result = await new ActRunner()
    .withWorkflow({
      body: `
name: Workflow printing the PR title
on:
  pull_request:
    types: [opened]

jobs:
  print_pr_title:
    runs-on: ubuntu-latest
    steps:
      - name: Print PR title
        if: github.event_name == 'pull_request'
        run: |
          echo "PR Title: ${{ github.event.pull_request.title }}"
  `,
    })
    .withEvent('pull_request', {
      pull_request: {
        title: 'Example PR payload as object',
      },
    })
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.jobs['print_pr_title']!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('PR Title: Example PR payload as object');
});
```

## Useful links

- [Wiki](https://github.com/pshevche/act-test-runner/wiki): full documentation, including a walkthrough of the public API and more usage examples.
- [Known limitations](https://github.com/pshevche/act-test-runner/wiki/Known-limitations): constraints to be aware of before adopting the library.
- [Examples](https://github.com/pshevche/act-test-runner/wiki/Examples): representative test cases showing the API in action, including testing a local action under development.
- [nektos/act](https://github.com/nektos/act): GitHub actions runner used by the plugin.
- [act User Guide](https://nektosact.com): describes various configuration options that the runner provides, as well as
  the format for input files.
