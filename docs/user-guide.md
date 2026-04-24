# User Guide

This user guide covers how to use `act-test-runner` to end-to-end test your GitHub Actions workflows locally.

## Supported Runners

The library supports two workflow runners:

- **[ActRunner](./act.md)** — wraps [nektos/act](https://github.com/nektos/act) for testing GitHub Actions workflows.
- **[ForgejoRunner](./forgejo.md)** — wraps [Forgejo Runner](https://forgejo.org/docs/latest/admin/actions/runner-installation/) for testing Forgejo Actions workflows.

Both runners share the same fluent builder API and differ only in the underlying executable they invoke.

## Getting Started

See the [README](../README.md) for a quick overview and usage examples.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development setup and how to run the test suites.
