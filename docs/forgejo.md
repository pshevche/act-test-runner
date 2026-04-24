# ForgejoRunner Guide

`ForgejoRunner` is the runner for end-to-end testing of Forgejo Actions workflows using the [Forgejo Runner](https://forgejo.org/docs/latest/admin/actions/runner-installation/).

## Prerequisites

Install `forgejo-runner` locally. The binary can be downloaded from the [Forgejo Runner releases page](https://code.forgejo.org/forgejo/runner/releases).

## Usage

```typescript
import { ForgejoRunner, ActExecStatus } from '@pshevche/act-test-runner';

const result = await new ForgejoRunner()
  .withWorkflowFile('.forgejo/workflows/ci.yml')
  .withEnvValues(['NODE_ENV', 'test'])
  .run();

expect(result.status).toBe(ActExecStatus.SUCCESS);
```

## API

`ForgejoRunner` extends `RunnerBase` and provides the same fluent builder API as `ActRunner`. See the [README](../README.md) for detailed usage examples.
