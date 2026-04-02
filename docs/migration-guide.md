# Migrating to Sincronia v2

This guide helps teams move from legacy Sincronia (Babel/Rhino workflows) to the new SDK + Fluent model.

## 1) Prerequisites

- Upgrade to Node.js 18+.
- Install the latest ServiceNow SDK tooling (`@servicenow/sdk`).
- Ensure your instance authentication is configured for each environment.

## 2) Replace legacy configuration

- Old: `sinc.config.js`, `.env`, manifest-driven tables
- New: `.sincronia.config.ts` with `environments` + `appRoot`

## 3) Move metadata to Fluent

Migrate table, ACL, BR, and API definitions into:

- `apps/<your-app>/fluent/tables`
- `apps/<your-app>/fluent/business-rules`
- `apps/<your-app>/fluent/acls`
- `apps/<your-app>/fluent/rest-apis`

## 4) Move logic to TypeScript

Script Includes and utilities should live under:

- `apps/<your-app>/src/includes`
- `apps/<your-app>/src/utils`

Use `now.include` for modular runtime imports in platform scripts.

## 5) Adopt new commands

- `npx sincronia init`
- `npx sincronia build`
- `npx sincronia deploy --env dev`
- `npx sincronia dev --watch`
- `npx sincronia generate table <name>`

## 6) CI/CD transition

Use generated templates from `templates/ci/` for GitHub Actions or Azure DevOps. These pipelines run lint/test/build and deploy by environment.

## 7) Retire old plugins

Legacy Babel/Sass/Webpack plugins are no longer required for server-side metadata pipelines. The new plugin model is lifecycle-based and SDK-first.
