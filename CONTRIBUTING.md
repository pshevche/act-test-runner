# Contributing

## Development

This project uses [pnpm](https://pnpm.io/installation) as the package manager.
Make sure it is installed before proceeding.

To install dependencies:

```bash
pnpm install
```

To run static checks (lint, formatting, types):

```bash
pnpm run check:all
```

To compile TypeScript:

```bash
pnpm run build
pnpm run clean # remove dist/
```

To run tests:

```bash
pnpm run test             # default TypeScript version (6.x)
pnpm run test:ts5         # TypeScript 5.x
pnpm run test:ts7         # TypeScript 7.x
pnpm run test:all         # all supported versions
pnpm run test -- <pattern>  # filter by file name
pnpm run test -- -t "<name>"  # filter by test name
```

To auto-fix issues:

```bash
pnpm run lint:fix
pnpm run prettier:fix
pnpm run license:fix
```

## OpenCode setup

This repository uses [OpenCode](https://opencode.ai) for AI-assisted
development. Project instructions are defined in `AGENTS.md`. Additional
OpenCode-specific configuration lives in `.opencode/`:
instructions, and skills for common workflows.
