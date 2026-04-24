# Contributing

## Prerequisites

This project supports two workflow runners for end-to-end testing:

- **[nektos/act](https://github.com/nektos/act)** — used by the `ActRunner` class
- **[Forgejo Runner](https://forgejo.org/docs/latest/admin/actions/runner-installation/)** — used by the `ForgejoRunner` class

You must install **both** runners to run the full test suite locally.

### Installing act

Follow the [act installation guide](https://nektosact.com/installation.html). On macOS with Homebrew:

```bash
brew install act
```

### Installing forgejo-runner

Follow the [Forgejo Runner installation guide](https://forgejo.org/docs/latest/admin/actions/runner-installation/). The binary can be downloaded from the [Forgejo Runner releases page](https://code.forgejo.org/forgejo/runner/releases):

```bash
curl -L -o /usr/local/bin/forgejo-runner "https://code.forgejo.org/forgejo/runner/releases/download/v11.0.0/forgejo-runner-11.0.0-linux-amd64"
chmod +x /usr/local/bin/forgejo-runner
```

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

## OpenCode setup

This repository uses [OpenCode](https://opencode.ai) for AI-assisted development. Project instructions are defined in `AGENTS.md`.
