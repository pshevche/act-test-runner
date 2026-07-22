# AGENTS.md

This file provides guidance to OpenCode when working with code in this repository.

## Project Overview

`@pshevche/act-test-runner` is a TypeScript library providing a fluent/builder-style API around [nektos/act](https://github.com/nektos/act) for end-to-end testing of GitHub Actions workflows locally. The main entry point is the `ActRunner` class.

## Commands

```bash
npm run check:all          # Run static checks (lint, prettier, types)
npm run build              # Compile TypeScript (outputs to dist/)
npm run clean              # Remove dist/
npm run test               # Run tests with Vitest (default TS version)
npm run test:ts5           # Run tests with TypeScript 5.x
npm run test:ts7           # Run tests with TypeScript 7.x
npm run test:all           # Run tests against all supported TS versions
npm run test -- <pattern>  # Run a specific test file (Vitest filter)
npm run types:check        # TypeScript type check only (no emit)
npm run lint:check         # ESLint (zero warnings allowed, flat config)
npm run prettier:check     # Check formatting
npm run license:check      # Verify MIT headers on src/ files
```

Fix variants: `npm run lint:fix`, `npm run prettier:fix`, `npm run license:fix`

Vitest test filter options: use `npm run test -- <pattern>` for file name
matching, or `npm run test -- -t "<test name>"` for test name matching.

## Architecture

- **`src/ActRunner.ts`** — Main public API. Fluent builder that configures workflow execution parameters and translates them to `act` CLI arguments via `ActRunnerParams`.
- **`src/ActWorkflowExecResult.ts`** / **`ActJobExecResult.ts`** — Result objects returned by `ActRunner.run()`. Workflow result contains a map of job results.
- **`src/ActExecStatus.ts`** — Enum of possible execution statuses: `SUCCESS`, `FAILED`, `SKIPPED`.
- **`src/ActRunnerError.ts`** — Custom error class for runner errors.
- **`src/internal/`** — Output parsing via listener pattern. `JobTrackingActExecListener` parses `act` stdout to extract job names and statuses. `OutputForwardingActExecListener` wraps it to also forward output to console.
- **`src/utils/`** — Validation (`checks.ts`), temp file creation (`fsutils.ts`), and object helpers (`objects.ts`).
- **`src/index.ts`** — Public exports: `ActRunner`, `ActWorkflowExecResult`, `ActJobExecResult`, `ActExecStatus`, `ActRunnerError`.

## Key Constraints

- **ESM-only** — `"type": "module"` in package.json. Use `.js` extensions in TypeScript imports.
- **Tests run sequentially** — `fileParallelism: false` in Vitest config because `act` runner invocations cannot be parallelized.
- **Test timeout is 50s** — workflow execution tests need time for `act` to run.
- **All source files require MIT license headers** — enforced by `addlicense` tool.
- **TypeScript strict mode** — `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters` enabled.
- **Multi-TS-version testing** — tests run against TypeScript 5.x, 6.x, and 7.x via `TS_VERSION` env var.
- **Node.js engine** — `^22.23.1 || ^24.0.0 || >=26.0.0` with npm `10.9.8` (engine-strict enabled).
