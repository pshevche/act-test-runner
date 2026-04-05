# AGENTS.md

This file provides guidance to OpenCode when working with code in this repository.

## Project Overview

`@pshevche/act-test-runner` is a TypeScript library providing a fluent/builder-style API around [nektos/act](https://github.com/nektos/act) for end-to-end testing of GitHub Actions workflows locally. The main entry point is the `ActRunner` class.

## Commands

```bash
npm run check              # Run all checks (lint, prettier, build, test)
npm run test               # Run tests (uses --experimental-vm-modules for ESM)
npm run test -- --testPathPattern='<pattern>'  # Run a specific test file
npm run lint:check         # ESLint (zero warnings allowed)
npm run prettier:check     # Check formatting
npm run package            # Compile TypeScript (outputs to dist/)
npm run license:check      # Verify MIT headers on src/ files
```

Fix variants: `npm run lint:fix`, `npm run prettier:fix`, `npm run license:fix`

## Architecture

- **`src/ActRunner.ts`** — Main public API. Fluent builder that configures workflow execution parameters and translates them to `act` CLI arguments via `ActRunnerParams`.
- **`src/ActWorkflowExecResult.ts`** / **`ActJobExecResult.ts`** — Result objects returned by `ActRunner.run()`. Workflow result contains a map of job results.
- **`src/internal/`** — Output parsing via listener pattern. `JobTrackingActExecListener` parses `act` stdout to extract job names and statuses. `OutputForwardingActExecListener` wraps it to also forward output to console.
- **`src/utils/`** — Validation (`checks.ts`), temp file creation (`fsutils.ts`), and object helpers (`objects.ts`).
- **`src/index.ts`** — Public exports: `ActRunner`, `ActWorkflowExecResult`, `ActJobExecResult`, `ActExecStatus`, `ActRunnerError`.

## Key Constraints

- **ESM-only** — `"type": "module"` in package.json. Use `.js` extensions in TypeScript imports.
- **Tests run sequentially** — `maxWorkers: 1` in Jest config because `act` runner invocations cannot be parallelized.
- **Test timeout is 30s** — workflow execution tests need time for `act` to run.
- **All source files require MIT license headers** — enforced by `addlicense` tool.
- **TypeScript strict mode** — `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters` enabled.
