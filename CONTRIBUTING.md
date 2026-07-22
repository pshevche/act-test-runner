# Contributing

## Development

To install dependencies:

```bash
npm install
```

To run static checks (lint, formatting, types):

```bash
npm run check:all
```

To compile TypeScript:

```bash
npm run build
npm run clean # remove dist/
```

To run tests:

```bash
npm run test             # default TypeScript version (6.x)
npm run test:ts5         # TypeScript 5.x
npm run test:ts7         # TypeScript 7.x
npm run test:all         # all supported versions
npm run test -- <pattern>  # filter by file name
npm run test -- -t "<name>"  # filter by test name
```

To auto-fix issues:

```bash
npm run lint:fix
npm run prettier:fix
npm run license:fix
```

## OpenCode setup

This repository uses [OpenCode](https://opencode.ai) for AI-assisted
development. Project instructions are defined in `AGENTS.md`. Additional
OpenCode-specific configuration lives in `.opencode/`:
instructions, and skills for common workflows.
