# ActRunner Guide

`ActRunner` is the default runner for end-to-end testing of GitHub Actions workflows using [nektos/act](https://github.com/nektos/act).

## Prerequisites

Install `act` locally. See the [act installation guide](https://nektosact.com/installation.html).

## Usage

```typescript
import { ActRunner, ActExecStatus } from '@pshevche/act-test-runner';

const result = await new ActRunner()
  .withWorkflowFile('.github/workflows/ci.yml')
  .withEnvValues(['NODE_ENV', 'test'])
  .run();

expect(result.status).toBe(ActExecStatus.SUCCESS);
```

## API

`ActRunner` extends `RunnerBase` and provides the same fluent builder API. See the [README](../README.md) for detailed usage examples.
