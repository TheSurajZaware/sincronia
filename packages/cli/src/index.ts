#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import chalk from "chalk";
import chokidar from "chokidar";
import { Command } from "commander";
import prompts from "prompts";
import {
  acquireLock,
  appendAuditEvent,
  asSincroniaError,
  createLogger,
  MetricsCollector,
  PluginManager,
  resolveEnvironment,
  type CommandExecutionContext,
  type RuntimeConfig,
  type RuntimeFlags,
  type SincroniaError,
} from "@sincronia/core";
import { createCiPlugin } from "@sincronia/plugin-ci";
import { createFluentPlugin } from "@sincronia/plugin-fluent";
import { createLintPlugin } from "@sincronia/plugin-lint";
import { createServiceNowPlugin } from "@sincronia/plugin-servicenow";
import { loadRuntimeConfig } from "./config.js";
import { generateFluentArtifact } from "./generators.js";

const program = new Command()
  .name("sincronia")
  .description(
    "Unified ServiceNow development platform (SDK + Fluent + CI/CD + DX)",
  )
  .version("2.0.0-next.0")
  .option("--verbose", "Enable verbose logs")
  .option("--trace", "Enable trace logging and fail-fast plugin mode")
  .option("--json-logs", "Emit structured JSON logs")
  .option("--dry-run", "Preview actions without applying changes")
  .option("--force", "Skip interactive confirmations");

const rootDir = process.cwd();

type Runtime = {
  config: RuntimeConfig;
  manager: PluginManager;
  metrics: MetricsCollector;
  logger: ReturnType<typeof createLogger>;
  runId: string;
  flags: RuntimeFlags;
};

const getFlags = (): RuntimeFlags => {
  const opts = program.opts<Record<string, boolean | undefined>>();
  return {
    verbose: Boolean(opts.verbose),
    trace: Boolean(opts.trace),
    jsonLogs: Boolean(opts.jsonLogs),
    dryRun: Boolean(opts.dryRun),
    force: Boolean(opts.force),
    failFast: !opts.trace,
  };
};

const makeContext = (
  runtime: Runtime,
  args: Record<string, unknown>,
  options: { env?: string; watch?: boolean },
): CommandExecutionContext => ({
  cwd: process.cwd(),
  rootDir,
  runId: runtime.runId,
  args,
  options,
  flags: runtime.flags,
  logger: runtime.logger,
  metrics: runtime.metrics,
  config: runtime.config,
});

const withRuntime = async (): Promise<Runtime> => {
  const config = await loadRuntimeConfig(rootDir);
  const runId = `run-${Date.now()}`;
  const flags = getFlags();
  const logger = createLogger({
    runId,
    json: Boolean(flags.jsonLogs),
    level: flags.trace || flags.verbose ? "debug" : "info",
  });
  const metrics = new MetricsCollector();
  const manager = new PluginManager();

  await manager.registerPlugin(
    createServiceNowPlugin({
      sdkCommand: config.sdkCommand,
      appRoot: config.appRoot,
    }),
  );
  await manager.registerPlugin(createFluentPlugin({ appRoot: config.appRoot }));
  await manager.registerPlugin(createLintPlugin({ appRoot: config.appRoot }));
  await manager.registerPlugin(createCiPlugin());

  return { config, manager, metrics, logger, runId, flags };
};

const formatError = (error: SincroniaError): string => {
  const cause =
    error.cause instanceof Error
      ? error.cause.message
      : error.cause
        ? String(error.cause)
        : undefined;
  return [
    `${error.category}: ${error.message}`,
    cause ? `Cause: ${cause}` : undefined,
    `Resolution: ${error.resolutionHint}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const executeLifecycleCommand = async (
  runtime: Runtime,
  name: string,
  context: CommandExecutionContext,
  runner: () => Promise<void>,
): Promise<void> => {
  const envName = context.options.env ?? runtime.config.defaultEnvironment;
  runtime.metrics.start(name);
  runtime.logger.info(`Starting ${name}`, { env: envName });

  try {
    await runner();
    const duration = runtime.metrics.end(name, true);
    runtime.logger.info(`${name} succeeded`, {
      env: envName,
      durationMs: duration,
    });
    await appendAuditEvent(context.rootDir, {
      ts: new Date().toISOString(),
      runId: context.runId,
      action: name,
      env: envName,
      outcome: "success",
      metadata: { durationMs: duration },
    });
  } catch (error) {
    runtime.metrics.end(name, false);
    const wrapped = asSincroniaError(error, {
      category: "BuildError",
      message: `Command '${name}' failed.`,
      resolutionHint: "Check logs and retry after resolving the root cause.",
      metadata: { name, env: envName },
    });
    await appendAuditEvent(context.rootDir, {
      ts: new Date().toISOString(),
      runId: context.runId,
      action: name,
      env: envName,
      outcome: "failure",
      metadata: {
        category: wrapped.category,
        message: wrapped.message,
      },
    });
    throw wrapped;
  }
};

const assertDeploymentPolicy = async (
  runtime: Runtime,
  envName: string,
): Promise<void> => {
  const resolved = resolveEnvironment(runtime.config, envName);
  const branch =
    process.env.GITHUB_REF_NAME ??
    process.env.BRANCH_NAME ??
    process.env.CI_COMMIT_REF_NAME ??
    "unknown";

  if (!resolved.policy.allowedBranches.includes("*")) {
    const allowed = resolved.policy.allowedBranches.some((b) =>
      b.endsWith("/*") ? branch.startsWith(b.replace("/*", "/")) : b === branch,
    );
    if (!allowed) {
      throw asSincroniaError(undefined, {
        category: "ValidationError",
        message: `Branch '${branch}' is not allowed to deploy to '${envName}'.`,
        resolutionHint: `Deploy from an allowed branch: ${resolved.policy.allowedBranches.join(", ")}`,
      });
    }
  }

  if (
    (resolved.policy.protected || resolved.policy.requireConfirmation) &&
    !runtime.flags.force
  ) {
    const answer = await prompts({
      type: "confirm",
      name: "confirm",
      message: `Deploy to protected environment '${envName}'?`,
      initial: false,
    });
    if (!answer.confirm) {
      throw asSincroniaError(undefined, {
        category: "DeploymentError",
        message: "Protected deployment cancelled by user.",
        resolutionHint:
          "Re-run with --force or confirm the protected deployment prompt.",
      });
    }
  }
};

program
  .command("init")
  .description("Initialize a Fluent-first ServiceNow project via SDK")
  .action(async () => {
    const runtime = await withRuntime();
    const context = makeContext(runtime, {}, {});
    await executeLifecycleCommand(runtime, "init", context, async () => {
      await runtime.manager.run("before:init", context);
      await runtime.manager.run("after:init", context);
    });
    process.stdout.write(chalk.green("Sincronia project initialized.\n"));
  });

program
  .command("build")
  .description("Compile Fluent metadata and TypeScript logic")
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const runtime = await withRuntime();
    const context = makeContext(runtime, {}, { env: opts.env });
    await executeLifecycleCommand(runtime, "build", context, async () => {
      await runtime.manager.run("before:build", context);
      await runtime.manager.run("after:build", context);
    });
    process.stdout.write(chalk.green("Build finished.\n"));
  });

program
  .command("deploy")
  .description("Deploy compiled app to a target instance")
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const runtime = await withRuntime();
    const envName = opts.env ?? runtime.config.defaultEnvironment;
    const context = makeContext(runtime, {}, { env: envName });
    await assertDeploymentPolicy(runtime, envName);
    const lock = await acquireLock(rootDir, `deploy-${envName}`);
    await executeLifecycleCommand(runtime, "deploy", context, async () => {
      await runtime.manager.run("before:deploy", context);
      await runtime.manager.run("after:deploy", context);
    }).finally(async () => {
      await lock.release();
    });
    process.stdout.write(chalk.green(`Deploy finished for env ${envName}.\n`));
  });

program
  .command("test")
  .description("Run unit and platform-aware tests")
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const runtime = await withRuntime();
    const context = makeContext(runtime, {}, { env: opts.env });
    await executeLifecycleCommand(runtime, "test", context, async () => {
      await runtime.manager.run("before:test", context);
      await runtime.manager.run("after:test", context);
    });
    process.stdout.write(chalk.green("Tests finished.\n"));
  });

program
  .command("lint")
  .description("Validate Fluent + TypeScript quality")
  .action(async () => {
    const runtime = await withRuntime();
    const context = makeContext(runtime, {}, {});
    await executeLifecycleCommand(runtime, "lint", context, async () => {
      await runtime.manager.run("before:lint", context);
      await runtime.manager.run("after:lint", context);
    });
    process.stdout.write(chalk.green("Lint finished.\n"));
  });

program
  .command("dev")
  .description("Start watch mode for Fluent build/deploy loop")
  .option("--watch", "Watch file system and auto-build/deploy", true)
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const runtime = await withRuntime();
    const envName = opts.env ?? runtime.config.defaultEnvironment;
    const context = makeContext(
      runtime,
      {},
      { env: envName, watch: Boolean(opts.watch) },
    );
    await executeLifecycleCommand(runtime, "dev", context, async () => {
      await runtime.manager.run("before:dev", context);
    });

    let timer: NodeJS.Timeout | undefined;
    let queue = Promise.resolve();
    const enqueueBuildDeploy = () => {
      queue = queue.then(async () => {
        await runtime.manager.run("before:build", context);
        await runtime.manager.run("before:deploy", context);
        runtime.logger.info("Auto build+deploy completed", { env: envName });
      });
      return queue;
    };

    process.stdout.write(
      chalk.cyan(`Watching ${runtime.config.appRoot} for changes...\n`),
    );
    const watcher = chokidar.watch(path.join(rootDir, runtime.config.appRoot), {
      ignoreInitial: true,
    });
    watcher.on("all", () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        void enqueueBuildDeploy();
      }, 400);
    });

    const cleanup = async () => {
      await watcher.close();
      if (timer) {
        clearTimeout(timer);
      }
      await runtime.manager.run("after:dev", context).catch(() => undefined);
      process.exit(0);
    };
    process.on("SIGINT", () => void cleanup());
    process.on("SIGTERM", () => void cleanup());
  });

program
  .command("sync")
  .description("Sync metadata from instance to source model")
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const runtime = await withRuntime();
    const envName = opts.env ?? runtime.config.defaultEnvironment;
    const context = makeContext(runtime, {}, { env: envName });
    const lock = await acquireLock(rootDir, `sync-${envName}`);
    await executeLifecycleCommand(runtime, "sync", context, async () => {
      await runtime.manager.run("before:sync", context);
      await runtime.manager.run("after:sync", context);
    }).finally(async () => {
      await lock.release();
    });
    process.stdout.write(chalk.green(`Sync finished for env ${envName}.\n`));
  });

program
  .command("generate")
  .description("Generate Fluent and TypeScript scaffolding")
  .argument("<type>", "Artifact type: table | br | api")
  .argument("[name]", "Artifact name")
  .action(async (type: "table" | "br" | "api", name?: string) => {
    const runtime = await withRuntime();
    const result =
      name ??
      (
        await prompts({
          type: "text",
          name: "value",
          message: "Artifact name",
        })
      ).value;

    if (!result) {
      throw asSincroniaError(undefined, {
        category: "ValidationError",
        message: "Missing artifact name.",
        resolutionHint: "Pass an artifact name or provide one when prompted.",
      });
    }

    const context = makeContext(runtime, { type, name: result }, {});
    await runtime.manager.run("before:generate", context);
    const outputPath = await generateFluentArtifact(
      path.join(rootDir, runtime.config.appRoot),
      type,
      result,
    );
    await runtime.manager.run("after:generate", context);
    process.stdout.write(chalk.green(`Generated: ${outputPath}\n`));
  });

program
  .command("env")
  .description("Print configured deployment environments")
  .action(async () => {
    const { config } = await withRuntime();
    for (const [name] of Object.entries(config.environments)) {
      const resolved = resolveEnvironment(config, name);
      process.stdout.write(
        `${name}: ${resolved.instances.map((i) => i.instanceUrl).join(", ")}\n`,
      );
    }
  });

program.parseAsync(process.argv).catch((error) => {
  const formatted =
    error instanceof Error
      ? formatError(
          asSincroniaError(error, {
            category: "BuildError",
            message: error.message,
            resolutionHint:
              "Re-run with --trace for additional diagnostic context.",
          }),
        )
      : String(error);
  process.stderr.write(chalk.red(`${formatted}\n`));
  process.exit(1);
});
