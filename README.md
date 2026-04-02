# Sincronia v2 - ServiceNow SDK + Fluent Platform

Sincronia is a next-generation, source-driven ServiceNow development platform built for Xanadu+ teams who want a modern DX without losing platform compatibility.

- Fluent-first metadata authoring (`tables`, `ACLs`, `BRs`, `APIs`)
- TypeScript-first business logic (`Script Includes`, utilities, tests)
- SDK-native build and deploy orchestration (`@servicenow/sdk`)
- Plugin-based CLI lifecycle for extensibility
- CI/CD templates for GitHub Actions and Azure DevOps

## Why Sincronia

ServiceNow teams often need all of these at once:

- Strict environment management across `dev`, `qa`, `prod`
- Metadata-as-code that is readable in git
- Fast local feedback loops and watch mode
- Repeatable CI/CD with secrets and approvals
- Shared standards for naming, quality, and performance

Sincronia combines SDK + Fluent + workspace tooling into one coherent platform so teams ship faster with fewer deployment surprises.

## Fluent + SDK Model

Sincronia treats Fluent as the source of truth for metadata. The ServiceNow SDK is used as the build/deploy execution layer.

1. Author metadata in `fluent/**/*.ts`
2. Author logic in `src/**/*.ts`
3. Run `sincronia build` (Fluent compile + SDK build)
4. Run `sincronia deploy --env <env>`

## Architecture

```mermaid
flowchart LR
  A[Developer] --> B[sincronia CLI]
  B --> C[Plugin Lifecycle]
  C --> D[@sincronia/plugin-fluent]
  C --> E[@sincronia/plugin-lint]
  C --> F[@sincronia/plugin-servicenow]
  C --> G[@sincronia/plugin-ci]
  D --> H[Fluent Metadata]
  E --> H
  F --> I[@servicenow/sdk]
  I --> J[ServiceNow Instance dev/qa/prod]
  B --> K[Turbo Workspace]
  K --> L[Apps + Packages + Tests]
```

## Monorepo Structure

```text
.
├─ apps/
│  └─ example-fluent-app/
│     ├─ fluent/
│     │  ├─ tables/
│     │  ├─ business-rules/
│     │  ├─ client-scripts/
│     │  ├─ rest-apis/
│     │  └─ acls/
│     ├─ src/
│     │  ├─ includes/
│     │  └─ utils/
│     ├─ tests/
│     └─ types/servicenow.generated.d.ts
├─ packages/
│  ├─ cli/
│  ├─ core/
│  ├─ plugin-servicenow/
│  ├─ plugin-fluent/
│  ├─ plugin-lint/
│  ├─ plugin-ci/
│  ├─ testing/
│  └─ types/
├─ templates/ci/
├─ .sincronia.config.ts
└─ turbo.json
```

## Requirements

- Node.js 18.18+
- npm 9+ (or compatible workspace package manager)
- ServiceNow SDK access and authenticated profiles

## Installation

```bash
npm install
npm run build
```

Initialize app scaffolding with SDK:

```bash
npx sincronia init
```

## Configuration

Environment and app configuration are defined in `.sincronia.config.ts`.

```ts
export default {
  defaultEnvironment: "dev",
  sdkCommand: ["npx", "@servicenow/sdk"],
  appRoot: "apps/example-fluent-app",
  environments: {
    dev: {
      instanceUrl: "https://dev00000.service-now.com",
      authProfile: "dev",
    },
    qa: { instanceUrl: "https://qa00000.service-now.com", authProfile: "qa" },
    prod: {
      instanceUrl: "https://prod00000.service-now.com",
      authProfile: "prod",
    },
  },
};
```

## CLI Commands

| Command                           | Description                               |
| --------------------------------- | ----------------------------------------- |
| `sincronia init`                  | Wrap SDK init and bootstrap CI templates  |
| `sincronia dev --watch --env=dev` | Watch files and auto-build/deploy         |
| `sincronia build --env=dev`       | Compile Fluent + TS via SDK lifecycle     |
| `sincronia deploy --env=qa`       | Deploy to specific environment            |
| `sincronia sync --env=dev`        | Placeholder for source sync orchestration |
| `sincronia test --env=dev`        | Run SDK-aligned test workflow             |
| `sincronia lint`                  | Validate Fluent naming and conventions    |
| `sincronia generate table <name>` | Scaffold Fluent table definition          |
| `sincronia generate br <name>`    | Scaffold Fluent business rule             |
| `sincronia generate api <name>`   | Scaffold Fluent REST API                  |
| `sincronia env`                   | List configured environments              |

## Fluent + TypeScript Usage

Example Fluent table:

```ts
export default {
  name: "u_sample_task",
  label: "Sample Task",
  extends: "task",
  columns: [{ name: "u_name", type: "string", mandatory: true, maxLength: 80 }],
};
```

Example Script Include with `now.include` modular import:

```ts
declare const now: { include: <T>(name: string) => T };

const shared = now.include<{ normalizeName(v: string): string }>(
  "x_sincronia.SharedTaskUtils",
);
```

## Plugin System

Sincronia plugins are npm-installable packages that hook into lifecycle events:

- `before:init`, `after:init`
- `before:build`, `after:build`
- `before:deploy`, `after:deploy`
- `before:test`, `after:test`
- `before:lint`, `after:lint`
- `before:dev`, `after:dev`
- `before:generate`, `after:generate`

Current built-in plugins:

- `@sincronia/plugin-servicenow` - SDK command execution wrapper
- `@sincronia/plugin-fluent` - Fluent discovery and watch integration
- `@sincronia/plugin-lint` - Fluent naming/quality validation
- `@sincronia/plugin-ci` - CI workflow scaffold generation

## CI/CD

Ready-to-use pipelines included:

- GitHub Actions:
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy.yml`
- Azure DevOps:
  - `azure-pipelines.yml`
- Reusable templates:
  - `templates/ci/github-actions.yml`
  - `templates/ci/azure-devops.yml`

Standard stages:

1. Install
2. Lint
3. Test
4. Build
5. Deploy (environment-scoped)

## Testing

Testing is powered by Vitest with a ServiceNow mock helper:

- `@sincronia/testing` provides `createServiceNowTestContext()`
- Unit tests live in `apps/*/tests`
- Coverage is generated via `vitest --coverage`

## Validation and Linting

`sincronia lint` validates:

- Fluent file discovery
- Naming conventions for Fluent artifacts
- TypeScript linting through workspace `eslint`

## Migration from Legacy Sincronia

A dedicated migration guide is available at `docs/migration-guide.md`.

High-level migration path:

1. Upgrade to Node 18+
2. Replace legacy config with `.sincronia.config.ts`
3. Move metadata to Fluent folders
4. Move logic to TypeScript includes/utils
5. Adopt new CLI and CI templates

## Git-First Development

Recommended defaults:

- Conventional commits with commitlint
- Husky pre-commit hooks
- Human-readable TypeScript metadata files for clean diffs

---

Sincronia v2 is designed to be the platform layer on top of ServiceNow SDK: scalable, extensible, and optimized for team velocity.
