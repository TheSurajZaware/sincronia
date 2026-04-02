import type { CommandExecutionContext, SincroniaPlugin } from "@sincronia/core";
import { execa } from "execa";

export type ServiceNowPluginOptions = {
  sdkCommand: string[];
  appRoot: string;
};

const runSdkCommand = async (
  ctx: CommandExecutionContext,
  options: ServiceNowPluginOptions,
  args: string[],
) => {
  const [command, ...baseArgs] = options.sdkCommand;
  if (!command) {
    throw new Error("sdkCommand must provide at least one executable token.");
  }
  await execa(command, [...baseArgs, ...args], {
    cwd: ctx.rootDir,
    stdio: "inherit",
    env: {
      SINCRONIA_ENV: ctx.options.env ?? "dev",
    },
  });
};

export const createServiceNowPlugin = (
  options: ServiceNowPluginOptions,
): SincroniaPlugin => ({
  name: "@sincronia/plugin-servicenow",
  hooks: {
    "before:init": async (ctx) => {
      await runSdkCommand(ctx, options, ["init", options.appRoot]);
    },
    "before:build": async (ctx) => {
      await runSdkCommand(ctx, options, ["build", options.appRoot]);
    },
    "before:deploy": async (ctx) => {
      const env = ctx.options.env ?? "dev";
      await runSdkCommand(ctx, options, [
        "deploy",
        options.appRoot,
        "--env",
        env,
      ]);
    },
    "before:test": async (ctx) => {
      await runSdkCommand(ctx, options, ["test", options.appRoot]);
    },
  },
});
