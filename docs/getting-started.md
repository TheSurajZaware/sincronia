# Getting Started

This guide gets Sincronia running in under 5 minutes.

## Prerequisites

- Node.js 18.18+
- npm 10+
- ServiceNow SDK authentication profile configured

## 1) Install

```bash
npm ci
```

## 2) Validate local setup

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## 3) Configure environments

Edit `.sincronia.config.ts`:

- Add all instances per environment (`dev`, `qa`, `stage`, `prod`)
- Set environment policies (`protected`, `requireConfirmation`, `allowedBranches`)

## 4) Core workflow

```bash
npx sincronia build --env dev
npx sincronia deploy --env dev
npx sincronia dev --watch --env dev
```

## 5) Safe production deployment

```bash
npx sincronia deploy --env prod --dry-run
npx sincronia deploy --env prod
```

Protected envs require explicit confirmation unless `--force` is used.
