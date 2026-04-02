import fs from "node:fs/promises";
import path from "node:path";
import type { SincroniaPlugin } from "@sincronia/core";

const githubWorkflowTemplate = `name: Sincronia CI/CD

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
    inputs:
      environment:
        description: "Deployment target"
        required: true
        type: choice
        options: [dev, qa, stage, prod]

permissions:
  contents: read

concurrency:
  group: generated-ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: build-test
    if: github.event_name == 'workflow_dispatch'
    environment: \${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm run deploy -- --env \${{ github.event.inputs.environment }}
        env:
          SN_AUTH_PROFILE: \${{ secrets.SN_AUTH_PROFILE }}
`;

export const createCiPlugin = (): SincroniaPlugin => ({
  name: "@sincronia/plugin-ci",
  hooks: {
    "after:init": async (ctx) => {
      const workflowPath = path.join(
        ctx.rootDir,
        ".github/workflows/sincronia-ci.yml",
      );
      await fs.mkdir(path.dirname(workflowPath), { recursive: true });
      await fs.writeFile(workflowPath, githubWorkflowTemplate, "utf8");
    },
  },
});
