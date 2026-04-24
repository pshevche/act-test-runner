# Contributing

## Prerequisites

This project supports two workflow runners for end-to-end testing:

- **[nektos/act](https://github.com/nektos/act)** — used by the `ActRunner` class
- **[Forgejo Runner](https://code.forgejo.org/forgejo/runner)** — used by the `ForgejoRunner` class

You must install `act` to run the act test suite locally. The Forgejo test suite runs via Docker by default (using `DockerForgejoRunner`), so no binary installation is required. If you prefer to run the Forgejo tests with a locally installed binary, set `CI=true` when running the tests.

### Installing act

Follow the [act installation guide](https://nektosact.com/installation.html).

### Installing forgejo-runner (optional)

If you want to run the Forgejo tests with a native binary instead of Docker, follow the [Forgejo Runner binary installation guide](https://forgejo.org/docs/latest/admin/actions/installation/binary/).

## Development

To install dependencies:

```bash
npm install
```

## Running tests

Run all tests (both act and forgejo suites):

```bash
npm test
```

Run only the act test suite:

```bash
npm run test:act
```

Run only the forgejo test suite:

```bash
npm run test:forgejo
```

## Verification

To run all verification tasks (lint, format, build, and tests):

```bash
npm run check
```

> **Note:** `npm run check` runs the full test suite and therefore requires `act` to be installed. If you only want to run a subset:
>
> ```bash
> npm run lint:check && npm run prettier:check && npm run package && npm run test:act
> ```

## OpenCode setup

This repository uses [OpenCode](https://opencode.ai) for AI-assisted development. Project instructions are defined in `AGENTS.md`.
