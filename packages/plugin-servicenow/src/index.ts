import fs from "node:fs/promises";
import path from "node:path";
import {
  asSincroniaError,
  type CommandExecutionContext,
  resolveEnvironment,
  type SincroniaPlugin,
  withRetry,
} from "@sincronia/core";
import { execa } from "execa";

export type ServiceNowPluginOptions = {
  sdkCommand: string[];
  appRoot: string;
};

const runSdkCommand = async (
  ctx: CommandExecutionContext,
  options: ServiceNowPluginOptions,
  args: string[],
  taskName: string,
) => {
  const envName = ctx.options.env ?? ctx.config?.defaultEnvironment ?? "dev";
  const configured = options.sdkCommand;
  const fallback = ["npx", "@servicenow/sdk"];
  const commands = [configured, fallback];

  let lastError: unknown;
  for (const commandParts of commands) {
    const [command, ...baseArgs] = commandParts;
    if (!command) {
      continue;
    }
    try {
      await withRetry(taskName, async () => {
        await execa(command, [...baseArgs, ...args], {
          cwd: ctx.rootDir,
          stdio: "inherit",
          env: {
            SINCRONIA_ENV: envName,
          },
        });
      });
      return;
    } catch (error) {
      lastError = error;
      ctx.logger.warn("SDK command attempt failed", {
        taskName,
        command,
      });
    }
  }

  throw asSincroniaError(lastError, {
    category: "SDKError",
    message: `ServiceNow SDK command failed for ${taskName}.`,
    resolutionHint:
      "Verify SDK availability, auth profile setup, and instance connectivity; then retry.",
    metadata: { taskName, args },
  });
};

const recordDeploySuccess = async (
  ctx: CommandExecutionContext,
  metadata: Record<string, unknown>,
): Promise<void> => {
  const historyDir = path.join(ctx.rootDir, ".sincronia", "history");
  await fs.mkdir(historyDir, { recursive: true });
  await fs.writeFile(
    path.join(historyDir, "last-successful-deploy.json"),
    JSON.stringify(
      {
        ts: new Date().toISOString(),
        env: ctx.options.env ?? "dev",
        runId: ctx.runId,
        ...metadata,
      },
      null,
      2,
    ),
    "utf8",
  );
};

const rollbackDeploy = async (
  ctx: CommandExecutionContext,
  options: ServiceNowPluginOptions,
): Promise<void> => {
  const historyPath = path.join(
    ctx.rootDir,
    ".sincronia",
    "history",
    "last-successful-deploy.json",
  );
  const previous = await fs.readFile(historyPath, "utf8").catch(() => "");
  if (!previous) {
    ctx.logger.warn(
      "Rollback skipped: no previous successful deploy metadata found.",
    );
    return;
  }
  await runSdkCommand(
    ctx,
    options,
    [
      "deploy",
      options.appRoot,
      "--env",
      String(ctx.options.env ?? "dev"),
      "--rollback",
    ],
    "rollback",
  );
};

export const createServiceNowPlugin = (
  options: ServiceNowPluginOptions,
): SincroniaPlugin => ({
  name: "@sincronia/plugin-servicenow",
  hooks: {
    "before:init": async (ctx) => {
      await runSdkCommand(ctx, options, ["init", options.appRoot], "init");
    },
    "before:build": async (ctx) => {
      if (ctx.args.skipFluentCompile === true && !ctx.flags.force) {
        ctx.logger.info(
          "Skipping SDK build because Fluent cache is unchanged.",
        );
        return;
      }
      await runSdkCommand(ctx, options, ["build", options.appRoot], "build");
    },
    "before:deploy": async (ctx) => {
      const envName =
        ctx.options.env ?? ctx.config?.defaultEnvironment ?? "dev";
      if (ctx.config) {
        resolveEnvironment(ctx.config, envName);
      }

      if (ctx.flags.dryRun) {
        ctx.logger.info("Dry-run mode active; deploy command not executed.", {
          env: envName,
        });
        return;
      }

      try {
        await runSdkCommand(
          ctx,
          options,
          ["deploy", options.appRoot, "--env", envName],
          "deploy",
        );
        await recordDeploySuccess(ctx, {
          appRoot: options.appRoot,
          envName,
        });
      } catch (error) {
        ctx.logger.error("Deploy failed; attempting best-effort rollback.", {
          env: envName,
        });
        await rollbackDeploy(ctx, options).catch(() => undefined);
        throw asSincroniaError(error, {
          category: "DeploymentError",
          message: `Deploy failed for environment '${envName}'.`,
          resolutionHint:
            "Review deploy logs and rollback status, then retry after resolving the failing metadata or credentials.",
          metadata: { envName },
        });
      }
    },
    "before:test": async (ctx) => {
      await runSdkCommand(ctx, options, ["test", options.appRoot], "test");
    },
    "before:sync": async (ctx) => {
      if (ctx.flags.dryRun) {
        ctx.logger.info("Dry-run mode active; sync command not executed.");
        return;
      }
      await runSdkCommand(ctx, options, ["download", options.appRoot], "sync");
    },
  },
});
