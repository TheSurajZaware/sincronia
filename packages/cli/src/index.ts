#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import chalk from "chalk";
import chokidar from "chokidar";
import { Command } from "commander";
import prompts from "prompts";
import { PluginManager, type CommandExecutionContext } from "@sincronia/core";
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
  .version("2.0.0-next.0");

const rootDir = process.cwd();

const makeContext = (
  args: Record<string, unknown>,
  options: { env?: string; watch?: boolean },
): CommandExecutionContext => ({
  cwd: process.cwd(),
  rootDir,
  args,
  options,
});

const withRuntime = async () => {
  const config = await loadRuntimeConfig(rootDir);
  const manager = new PluginManager();
  manager.registerPlugin(
    createServiceNowPlugin({
      sdkCommand: config.sdkCommand,
      appRoot: config.appRoot,
    }),
  );
  manager.registerPlugin(createFluentPlugin({ appRoot: config.appRoot }));
  manager.registerPlugin(createLintPlugin({ appRoot: config.appRoot }));
  manager.registerPlugin(createCiPlugin());

  return { config, manager };
};

program
  .command("init")
  .description("Initialize a Fluent-first ServiceNow project via SDK")
  .action(async () => {
    const { manager } = await withRuntime();
    const context = makeContext({}, {});
    await manager.run("before:init", context);
    await manager.run("after:init", context);
    process.stdout.write(chalk.green("Sincronia project initialized.\n"));
  });

program
  .command("build")
  .description("Compile Fluent metadata and TypeScript logic")
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const { manager } = await withRuntime();
    const context = makeContext({}, { env: opts.env });
    await manager.run("before:build", context);
    await manager.run("after:build", context);
    process.stdout.write(chalk.green("Build finished.\n"));
  });

program
  .command("deploy")
  .description("Deploy compiled app to a target instance")
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const { manager } = await withRuntime();
    const context = makeContext({}, { env: opts.env });
    await manager.run("before:deploy", context);
    await manager.run("after:deploy", context);
    process.stdout.write(
      chalk.green(`Deploy finished for env ${opts.env ?? "dev"}.\n`),
    );
  });

program
  .command("test")
  .description("Run unit and platform-aware tests")
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const { manager } = await withRuntime();
    const context = makeContext({}, { env: opts.env });
    await manager.run("before:test", context);
    await manager.run("after:test", context);
    process.stdout.write(chalk.green("Tests finished.\n"));
  });

program
  .command("lint")
  .description("Validate Fluent + TypeScript quality")
  .action(async () => {
    const { manager } = await withRuntime();
    const context = makeContext({}, {});
    await manager.run("before:lint", context);
    await manager.run("after:lint", context);
    process.stdout.write(chalk.green("Lint finished.\n"));
  });

program
  .command("dev")
  .description("Start watch mode for Fluent build/deploy loop")
  .option("--watch", "Watch file system and auto-build/deploy", true)
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const { config, manager } = await withRuntime();
    const context = makeContext(
      {},
      { env: opts.env, watch: Boolean(opts.watch) },
    );
    await manager.run("before:dev", context);
    process.stdout.write(
      chalk.cyan(`Watching ${config.appRoot} for changes...\n`),
    );
    const watcher = chokidar.watch(path.join(rootDir, config.appRoot), {
      ignoreInitial: true,
    });
    watcher.on("change", async () => {
      await manager.run("before:build", context);
      await manager.run("before:deploy", context);
      process.stdout.write(chalk.cyan("Auto build+deploy completed.\n"));
    });
  });

program
  .command("sync")
  .description("Sync metadata from instance to source model")
  .option("--env <name>", "Environment name")
  .action(async (opts) => {
    const { config } = await withRuntime();
    process.stdout.write(
      chalk.yellow(
        `Sync is scaffolded. Configure SDK sync command for ${opts.env ?? config.defaultEnvironment} in plugin-servicenow.\n`,
      ),
    );
  });

program
  .command("generate")
  .description("Generate Fluent and TypeScript scaffolding")
  .argument("<type>", "Artifact type: table | br | api")
  .argument("[name]", "Artifact name")
  .action(async (type: "table" | "br" | "api", name?: string) => {
    const { config, manager } = await withRuntime();
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
      throw new Error("Missing artifact name.");
    }

    const context = makeContext({ type, name: result }, {});
    await manager.run("before:generate", context);
    const outputPath = await generateFluentArtifact(
      path.join(rootDir, config.appRoot),
      type,
      result,
    );
    await manager.run("after:generate", context);
    process.stdout.write(chalk.green(`Generated: ${outputPath}\n`));
  });

program
  .command("env")
  .description("Print configured deployment environments")
  .action(async () => {
    const { config } = await withRuntime();
    for (const [name, env] of Object.entries(config.environments)) {
      process.stdout.write(`${name}: ${env.instanceUrl}\n`);
    }
  });

program.parseAsync(process.argv).catch((error) => {
  process.stderr.write(
    chalk.red(`${error instanceof Error ? error.message : String(error)}\n`),
  );
  process.exit(1);
});
