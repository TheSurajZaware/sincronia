# Sincronia

Sincronia is an enterprise-ready TypeScript platform for modern ServiceNow development, built around the latest ServiceNow SDK and Fluent metadata-as-code workflows.

## Key Features

- Modern TypeScript monorepo architecture with Node.js 18+
- ServiceNow SDK v4+ aligned command orchestration
- Fluent DSL as first-class metadata layer
- Plugin-based architecture for scalability and extensibility
- Multi-instance environment support (`dev`, `qa`, `stage`, `prod`)
- CI/CD automation with GitHub Actions and Azure DevOps templates
- Hot-reload development mode with watch, debounce, and safe deploy queueing
- Reliability features: typed errors, retry/backoff, deploy locks, audit logs
- Testing strategy spanning unit, integration, and E2E workflow simulation

## Getting Started

### Prerequisites

- Node.js 18.18+
- npm 10+
- ServiceNow SDK authentication configured for your environments

### Install

```bash
npm ci
npm run ci
```

### Initialize and Run

```bash
npx sincronia init
npx sincronia build --env dev
npx sincronia deploy --env dev
```

### Safe Production Flow

```bash
npx sincronia deploy --env prod --dry-run
npx sincronia deploy --env prod
```

## Usage

### Common Commands

| Command                           | Purpose                                |
| --------------------------------- | -------------------------------------- | ----------- | ----------------------------- |
| `sincronia init`                  | Initialize SDK + project scaffolding   |
| `sincronia dev --watch --env dev` | Watch files and auto build/deploy      |
| `sincronia build --env <env>`     | Compile metadata and logic             |
| `sincronia deploy --env <env>`    | Deploy to target environment           |
| `sincronia sync --env <env>`      | Sync source metadata with instance     |
| `sincronia test --env <env>`      | Execute test workflow                  |
| `sincronia lint`                  | Validate Fluent + TypeScript standards |
| `sincronia generate table         | br                                     | api <name>` | Generate metadata scaffolding |
| `sincronia env`                   | List configured environment instances  |

### Environment Configuration

Sincronia uses `.sincronia.config.ts` with environment policies and instance groups.

```ts
export default {
  defaultEnvironment: "dev",
  sdkCommand: ["npx", "@servicenow/sdk"],
  appRoot: "apps/example-fluent-app",
  environments: {
    dev: {
      instances: [
        {
          name: "dev-primary",
          instanceUrl: "https://dev00000.service-now.com",
          authProfile: "dev",
        },
      ],
      policy: {
        protected: false,
        requireConfirmation: false,
        allowedBranches: ["*"],
      },
    },
    prod: {
      instances: [
        {
          name: "prod-primary",
          instanceUrl: "https://prod00000.service-now.com",
          authProfile: "prod",
        },
      ],
      policy: {
        protected: true,
        requireConfirmation: true,
        allowedBranches: ["main"],
      },
    },
  },
};
```

## Documentation

- [Technical Documentation](docs/technical.md)
- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [CLI Guide](docs/cli.md)
- [Fluent Guide](docs/fluent-guide.md)
- [CI/CD Guide](docs/ci-cd.md)
- [Plugin System](docs/plugin-system.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Security Policy](SECURITY.md)
- [Migration Guide](docs/migration-guide.md)

## Contributing

Contributions are welcome. For consistency and release automation:

- Follow conventional commits (e.g. `feat:`, `fix:`, `docs:`)
- Run quality checks before pushing:

```bash
npm run ci
```

- Keep changes typed, tested, and documented

## License

Licensed under the terms in [LICENSE](LICENSE).
