# act-test-runner

[![Build](https://github.com/pshevche/act-test-runner/actions/workflows/verify.yaml/badge.svg)](https://github.com/pshevche/act-test-runner/actions/workflows/verify.yaml)

**Convenient wrapper around [act](https://github.com/nektos/act) for implementing e2e tests for GitHub actions**

The library defines an opinionated runner interface for executing GitHub workflows locally using
the [act](https://github.com/nektos/act) runner.

Consumers can assert on the outcome of the workflow execution, such as the jobs run, workflow's output, or artifacts
persisted in the artifact server or action cache.

## Usage

### Example project

To try it out yourself, check out the [act-test-runner-example](https://github.com/pshevche/act-test-runner-example) repository.

### Assert on the workflow file execution

```JavaScript
test('custom workflow', async () => {
  const result = await new ActRunner()
    .withWorkflowBody(
      `
name: Simple passing workflow
on: [push]

jobs:
  successful_job:
    runs-on: ubuntu-latest
    steps:
      - name: Successful step
        run: echo "Hello, World!"
  `,
    )
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  expect(result.output).toContain('Hello, World!');
  expect(result.jobs.size).toBe(1);

  const successfulJob = result.job('successful_job')!;
  expect(successfulJob.status).toBe(ActExecStatus.SUCCESS);
  expect(successfulJob.output).toContain('Hello, World!');
});
```

### Define event to trigger the workflow

```JavaScript
test('custom workflow with event', async () => {
  const result = await new ActRunner()
    .withWorkflowBody(
      `
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
    )
    .withEvent('pull_request', {
      pull_request: {
        title: 'Example PR payload as object',
      },
    })
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_pr_title')!;
  expect(prJob.status).toBe(ActExecStatus.SUCCESS);
  expect(prJob.output).toContain('PR Title: Example PR payload as object');
});
```

### Set additional workflow inputs

```JavaScript
test('custom workflow with inputs', async () => {
  const result = await new ActRunner()
    .withWorkflowBody(
      `
name: Simple workflow printing a couple of environment variables
on: [push]

jobs:
  print_greeting:
    runs-on: ubuntu-latest
    steps:
      - name: Print greeting from env variables
        run: echo "$GREETING, $NAME!"
  `,
    )
    .withEnvValues(['GREETING', 'Hello'], ['NAME', 'Bruce'])
    .run();

  expect(result.status).toBe(ActExecStatus.SUCCESS);
  const job = result.job('print_greeting')!;
  expect(job.status).toBe(ActExecStatus.SUCCESS);
  expect(job.output).toContain('Hello, Bruce!');
});
```

## Useful links

- [Example project](https://github.com/pshevche/act-test-runner-example): a sample project that demonstrates how to use `act-test-runner` with a custom action.
- [nektos/act](https://github.com/nektos/act): GitHub actions runner used by the plugin.
- [act User Guide](https://nektosact.com): describes various configuration options that the runner provides, as well as
  the format for input files.

## Known limitations

### Sequential runner invocations

Currently, `act` command has a state shared between invocations.
Invoking `act` in-parallel (e.g. to evaluate multiple workflows) may result in a polluted state and as a result flaky
workflow executions.

### Supported `act` options

`act` provides a large number of options to configure workflow execution.
This library aims to abstract away the configuration effort and enforce best practices.
Therefore, the initial release of the library has a built-in support for a small set of options deemed essential to design meaningful test scenarios for GitHub workflows.

Additional unsupported arguments can be passed using the `additionalArgs` property of a `ActRunner` object.
Despite having this option, feel free to submit a feature request for a new option describing how the library and its
users will benfit from having a native support for this property.
