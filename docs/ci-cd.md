# CI/CD Guide

## GitHub Actions

- `ci.yml` runs `typecheck`, `lint`, `test`, `build`.
- `deploy.yml` is manual (`workflow_dispatch`) with environment selection.
- Use GitHub Environments for approval gates and secret scoping.

## Azure DevOps

- Validate stage: install, typecheck, lint, test, build.
- Promotion stages: `DeployDev` -> `DeployQa` -> `DeployProd`.
- Add manual approvals on environment resources for `qa/stage/prod`.

## Required secrets

- `SN_AUTH_PROFILE` (or environment-specific variants)
- Optional additional SDK auth variables per enterprise policy

## Safe deployment pattern

1. Build and test on PR
2. Deploy to dev after merge
3. Promote to qa/stage after validation
4. Approve and deploy to prod

## Dry-run strategy

Use:

```bash
npx sincronia deploy --env prod --dry-run
```

before production releases.
