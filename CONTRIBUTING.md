# Contributing

## Development

To install dependencies:

```bash
npm install
```

To run verification tasks:

```bash
npm run check
```

## OpenCode setup

This repository uses [OpenCode](https://opencode.ai) for AI-assisted development. Project instructions are defined in `AGENTS.md`.

### Apply common OpenCode conventions

1. **Install direnv** (if not already installed):
   ```bash
   brew install direnv
   ```

2. **Add to your shell** (`~/.zshrc`):
   ```bash
   eval "$(direnv hook zsh)"
   ```

3. **Allow direnv** (one-time):
   ```bash
   direnv allow
   ```

This loads the shared OpenCode configuration from `.opencode-conventions/`, which includes:
- **Plugins**: `superpowers` - AI-powered workflows
- **Skills**: `gh-issue`, `grill-me` - Issue management and design discussions
- **Instructions**: Conventional Commits documentation

The shared config is loaded automatically via the `OPENCODE_CONFIG_DIR` environment variable set in `.envrc`. Repo-specific settings in `opencode.json` take precedence over shared config.
