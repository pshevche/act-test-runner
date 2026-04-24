# act-test-runner

[![Build](https://github.com/pshevche/act-test-runner/actions/workflows/verify.yaml/badge.svg)](https://github.com/pshevche/act-test-runner/actions/workflows/verify.yaml)

**Fluent builder API for end-to-end testing of GitHub Actions and Forgejo Actions workflows locally.**

This library provides an opinionated, type-safe wrapper around [nektos/act](https://github.com/nektos/act) and the [Forgejo Runner](https://code.forgejo.org/forgejo/runner). It lets you write concise, readable tests that execute workflows in isolated Docker containers and assert on job outcomes, console output, artifacts, and cache entries.

## Sneak Preview

```typescript
import { ActRunner, ActExecStatus } from '@pshevche/act-test-runner';

const result = await new ActRunner()
  .withWorkflowBody(
    `
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Hello, World!"
  `,
  )
  .run();

expect(result.status).toBe(ActExecStatus.SUCCESS);
expect(result.job('test')!.output).toContain('Hello, World!');
```

## Documentation

- **[User Guide](docs/user-guide.md)** — getting started, runner comparison, usage examples, and known limitations.
- **[ActRunner Guide](docs/act.md)** — detailed guide for the nektos/act runner.
- **[ForgejoRunner Guide](docs/forgejo.md)** — detailed guide for the Forgejo runner.
- **[Contributing](CONTRIBUTING.md)** — development setup, prerequisites, and how to run the test suites.
