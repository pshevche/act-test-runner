# ForgejoRunner Guide

`ForgejoRunner` is the runner for end-to-end testing of Forgejo Actions workflows using the [Forgejo Runner](https://code.forgejo.org/forgejo/runner).

## Prerequisites

Install `forgejo-runner` locally. The binary can be downloaded from the [Forgejo Runner releases page](https://code.forgejo.org/forgejo/runner/releases).

> **Note:** A Docker-based runner (`DockerForgejoRunner`) is currently not supported.

## Usage

### Assert on the workflow file execution

```typescript
import { ForgejoRunner, ActExecStatus } from '@pshevche/act-test-runner';

const result = await new ForgejoRunner()
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
```

### Define event to trigger the workflow

```typescript
const result = await new ForgejoRunner()
  .withWorkflowBody(`
name: Workflow printing the event_type
on:
  pull_request:
    types: [opened]
  issues:
    types: [opened]

jobs:
  print_event_type:
    runs-on: ubuntu-latest
    steps:
      - name: Print event type
        run: |
          echo "Event type: ${{ forgejo.event_name }}"
  `)
  .withEvent('pull_request')
  .run();

expect(result.status).toBe(ActExecStatus.SUCCESS);
const job = result.job('print_event_type')!;
expect(job.status).toBe(ActExecStatus.SUCCESS);
expect(job.output).toContain('Event type: pull_request');
```

### Set additional workflow inputs

```typescript
const result = await new ForgejoRunner()
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
```

## Useful links

- [Forgejo Runner repository](https://code.forgejo.org/forgejo/runner): source code and releases for the Forgejo runner.
- [Forgejo documentation](https://forgejo.org/docs): official Forgejo documentation, including runner installation and usage guides.
