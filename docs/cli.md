# CLI Reference

## Global options

- `--verbose`: debug-level logs
- `--trace`: trace mode and non-fail-fast plugin behavior
- `--json-logs`: structured JSON logs
- `--dry-run`: evaluate actions without applying deployment
- `--force`: bypass confirmations for protected actions

## Commands

- `sincronia init`
- `sincronia build --env <name>`
- `sincronia deploy --env <name> [--dry-run] [--force]`
- `sincronia sync --env <name>`
- `sincronia test --env <name>`
- `sincronia lint`
- `sincronia dev --watch --env <name>`
- `sincronia generate table|br|api <name>`
- `sincronia env`

## Deployment safety controls

- Protected environments can require confirmation.
- Branch restrictions can block unsafe deploys.
- Locking prevents concurrent deploy/sync operations in a workspace.

## Error handling contract

All critical failures are normalized into typed categories:

- `ValidationError`
- `BuildError`
- `DeploymentError`
- `NetworkError`
- `SDKError`
- `ConfigError`
- `PluginError`
- `LockError`
