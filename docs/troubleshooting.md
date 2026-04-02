# Troubleshooting

## ConfigError: no config file found

- Ensure one of these exists at repository root:
  - `.sincronia.config.ts`
  - `.sincronia.config.mts`
  - `.sincronia.config.js`
  - `.sincronia.config.mjs`
  - `.sincronia.config.cjs`

## ValidationError: defaultEnvironment missing

- Set `defaultEnvironment` to a key present in `environments`.

## SDKError during build/deploy/sync

- Confirm SDK command is installed and reachable.
- Verify auth profile exists and has required permissions.
- Re-run with `--trace` for additional diagnostics.

## LockError: lock already held

- Another process is using deploy/sync lock.
- Wait for completion, or remove stale lock from `.sincronia/locks` if safe.

## Deployment blocked by branch policy

- Check `allowedBranches` in environment policy.
- Deploy from approved branch or update policy intentionally.

## Protected deployment cancelled

- Re-run and confirm prompt, or use `--force` in automated approved workflows.
