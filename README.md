# act-test-runner

[![Build](https://github.com/pshevche/act-test-runner/actions/workflows/verify.yaml/badge.svg)](https://github.com/pshevche/gradle-act-plugin/actions/workflows/verify.yaml)

**Convenient wrapper around [act](https://github.com/nektos/act) for implementing e2e tests for GitHub actions**

The library defines an opinionated runner interface for executing GitHub workflows locally using the [act](https://github.com/nektos/act) runner.

Consumers can assert on the outcome of the workflow execution, such as the jobs run, workflow's output, or artifacts persisted in the artifact server or action cache.

## Development

This project was created using `bun init` in bun v1.2.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

To install dependencies:

```bash
bun install
```

To run verification tasks:

```bash
bun run check
```

## Known limitations

### Sequential runner invocations

Currently, `act` command has a state shared between invocations.
Invoking `act` in-parallel (e.g. to evaluate multiple workflows) may result in a polluted state and as a result flaky workflow executions.

### Supported `act` options

`act` provides a large number of options to configure workflow execution.
This library aims to abstract away the configuration effort and enforce best practices.
Therefore, the initial release of the library has a built-in support for a small set of options deemed essential to design meaningful test scenarios for GitHub workflows.

Additional unsupported arguments can be passed using the `additionalArgs` property of a `ActRunner` object.
Despite having this option, feel free to submit a feature request for a new option describing how the library and its users will benfit from having a native support for this property.

## Useful links

- https://github.com/nektos/act[nektos/act]: GitHub actions runner used by the plugin.
- https://nektosact.com/[act User Guide]: describes various configuration options that the runner provides, as well as the format for input files.

## ToDo

- [ ] release
- [ ] e2e example
- [ ] renovate
- [ ] update integrations doc
- [ ] deprecate Gradle plugin
