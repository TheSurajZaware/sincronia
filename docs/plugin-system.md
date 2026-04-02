# Plugin System

Sincronia plugins are lifecycle-driven npm packages.

## Interface

Plugins implement `SincroniaPlugin` from `@sincronia/core`.

Key extension points:

- `setup(api)` for initialization
- `hooks[event]` for command lifecycle interception
- `extendCli(api)` for future command registration extensions

## Lifecycle Events

- `before:init`, `after:init`
- `before:build`, `after:build`
- `before:deploy`, `after:deploy`
- `before:test`, `after:test`
- `before:sync`, `after:sync`
- `before:lint`, `after:lint`
- `before:dev`, `after:dev`
- `before:generate`, `after:generate`

## Stability and safety model

- Hooks run with typed execution context (`runId`, logger, metrics, config).
- Hook failures are categorized and isolated when non-fail-fast mode is enabled (`--trace`).
- Production operations should be implemented with retries and idempotency.
- Plugins should avoid long-lived unmanaged resources; close watchers/sockets on shutdown.

## Built-in Plugins

- `@sincronia/plugin-servicenow`: wraps ServiceNow SDK execution
- `@sincronia/plugin-fluent`: Fluent file validation and watch behavior
- `@sincronia/plugin-lint`: naming convention and static checks
- `@sincronia/plugin-ci`: CI workflow generation

## Authoring a Plugin

1. Create `packages/plugin-your-name`.
2. Export a factory `createYourPlugin(options)`.
3. Register hooks in `setup` or the `hooks` object.
4. Register package in root workspaces and CLI bootstrap.
