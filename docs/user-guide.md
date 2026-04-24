# User Guide

This user guide covers how to use `act-test-runner` to end-to-end test your GitHub Actions workflows locally.

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

## Supported Runners

The library supports two workflow runners:

- **[ActRunner](./act.md)** — wraps [nektos/act](https://github.com/nektos/act) for testing GitHub Actions workflows.
- **[ForgejoRunner](./forgejo.md)** — wraps [Forgejo Runner](https://code.forgejo.org/forgejo/runner) for testing Forgejo Actions workflows.

Both runners share the same fluent builder API and differ only in the underlying executable they invoke.

## Getting Started

See the individual runner guides for detailed usage examples:

- [ActRunner Guide](./act.md)
- [ForgejoRunner Guide](./forgejo.md)

## Known Limitations

### Sequential runner invocations

Currently, the underlying runner commands have state shared between invocations.
Invoking them in parallel (e.g. to evaluate multiple workflows) may result in a polluted state and as a result flaky workflow executions.

### Supported runner options

Both `act` and `forgejo-runner` provide a large number of options to configure workflow execution.
This library aims to abstract away the configuration effort and enforce best practices.
Therefore, the initial release of the library has built-in support for a small set of options deemed essential to design meaningful test scenarios.

Additional unsupported arguments can be passed using the `withAdditionalArgs` method.
Despite having this option, feel free to submit a feature request for a new option describing how the library and its users will benefit from having native support for it.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development setup and how to run the test suites.
