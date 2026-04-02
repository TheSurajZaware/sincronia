import { z } from "zod";
import { asSincroniaError, type SincroniaError } from "./errors.js";
import type { Logger } from "./logger.js";
import type { MetricsCollector } from "./metrics.js";

export type RuntimeFlags = {
  dryRun?: boolean;
  force?: boolean;
  verbose?: boolean;
  trace?: boolean;
  jsonLogs?: boolean;
  failFast?: boolean;
};

export type CommandExecutionContext = {
  cwd: string;
  rootDir: string;
  runId: string;
  args: Record<string, unknown>;
  options: {
    env?: string;
    watch?: boolean;
  };
  flags: RuntimeFlags;
  logger: Logger;
  metrics: MetricsCollector;
  config?: RuntimeConfig;
};

export type LifecycleEvent =
  | "before:init"
  | "after:init"
  | "before:build"
  | "after:build"
  | "before:deploy"
  | "after:deploy"
  | "before:test"
  | "after:test"
  | "before:sync"
  | "after:sync"
  | "before:lint"
  | "after:lint"
  | "before:dev"
  | "after:dev"
  | "before:generate"
  | "after:generate";

export type PluginHook = (
  context: CommandExecutionContext,
) => Promise<void> | void;

export interface SincroniaPlugin {
  name: string;
  setup?: (api: PluginApi) => Promise<void> | void;
  hooks?: Partial<Record<LifecycleEvent, PluginHook>>;
  extendCli?: (api: PluginCliExtensionApi) => void;
}

export interface PluginApi {
  registerHook(event: LifecycleEvent, hook: PluginHook): void;
}

export interface PluginCliExtensionApi {
  registerCommand(name: string, description: string): void;
}

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

const instanceSchema = z.object({
  name: z.string().min(1),
  instanceUrl: z.string().url(),
  authProfile: z.string().optional(),
  username: z.string().optional(),
  passwordEnvVar: z.string().optional(),
});

const legacyEnvironmentSchema = z.object({
  instanceUrl: z.string().url(),
  authProfile: z.string().optional(),
  username: z.string().optional(),
  passwordEnvVar: z.string().optional(),
});

const environmentPolicySchema = z.object({
  protected: z.boolean().default(false),
  requireConfirmation: z.boolean().default(false),
  allowedBranches: z.array(z.string()).default(["*"]),
});

const environmentSchema = z.union([
  z.object({
    instances: z.array(instanceSchema).min(1),
    policy: environmentPolicySchema.default({}),
  }),
  legacyEnvironmentSchema,
]);

export const runtimeConfigSchema = z
  .object({
    defaultEnvironment: z.string().default("dev"),
    sdkCommand: z.array(z.string()).min(1).default(["npx", "@servicenow/sdk"]),
    appRoot: z.string().default("apps/example-fluent-app"),
    environments: z.record(environmentSchema),
  })
  .superRefine((value, ctx) => {
    if (!value.environments[value.defaultEnvironment]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `defaultEnvironment '${value.defaultEnvironment}' is not present in environments.`,
        path: ["defaultEnvironment"],
      });
    }
  });

export type HookFailure = {
  pluginName: string;
  event: LifecycleEvent;
  error: SincroniaError;
};

export type EnvironmentInstance = z.infer<typeof instanceSchema>;
export type RuntimeEnvironment = {
  instances: EnvironmentInstance[];
  policy: z.infer<typeof environmentPolicySchema>;
};

export const resolveEnvironment = (
  config: RuntimeConfig,
  envName: string,
): RuntimeEnvironment => {
  const env = config.environments[envName];
  if (!env) {
    throw asSincroniaError(undefined, {
      category: "ValidationError",
      message: `Environment '${envName}' is not configured.`,
      resolutionHint:
        "Add this environment in .sincronia.config.* or pass a valid --env option.",
    });
  }

  if ("instances" in env) {
    return {
      instances: env.instances,
      policy: env.policy,
    };
  }

  return {
    instances: [
      {
        name: envName,
        instanceUrl: env.instanceUrl,
        authProfile: env.authProfile,
        username: env.username,
        passwordEnvVar: env.passwordEnvVar,
      },
    ],
    policy: {
      protected: envName === "prod" || envName === "production",
      requireConfirmation: envName === "prod" || envName === "production",
      allowedBranches: envName === "prod" ? ["main", "master"] : ["*"],
    },
  };
};

export class PluginManager {
  private hooks = new Map<
    LifecycleEvent,
    Array<{ pluginName: string; hook: PluginHook }>
  >();

  async registerPlugin(plugin: SincroniaPlugin): Promise<void> {
    if (!plugin.name || plugin.name.trim().length < 3) {
      throw asSincroniaError(undefined, {
        category: "ValidationError",
        message: "Plugin registration failed: missing or invalid plugin name.",
        resolutionHint: "Ensure the plugin exports a unique non-empty name.",
      });
    }

    const api: PluginApi = {
      registerHook: (event, hook) => {
        const existing = this.hooks.get(event) ?? [];
        existing.push({ pluginName: plugin.name, hook });
        this.hooks.set(event, existing);
      },
    };

    await plugin.setup?.(api);

    if (plugin.hooks) {
      for (const [event, hook] of Object.entries(plugin.hooks) as Array<
        [LifecycleEvent, PluginHook]
      >) {
        api.registerHook(event, hook);
      }
    }
  }

  async run(
    event: LifecycleEvent,
    context: CommandExecutionContext,
  ): Promise<{ failures: HookFailure[] }> {
    const hooks = this.hooks.get(event) ?? [];
    const failures: HookFailure[] = [];

    for (const entry of hooks) {
      try {
        await entry.hook(context);
      } catch (error) {
        const wrapped = asSincroniaError(error, {
          category: "PluginError",
          message: `Plugin hook failed: ${entry.pluginName} during ${event}`,
          resolutionHint:
            "Review plugin logs and disable or fix the failing plugin before retrying.",
          metadata: { pluginName: entry.pluginName, event },
        });
        failures.push({ pluginName: entry.pluginName, event, error: wrapped });
        context.logger.error(wrapped.message, {
          category: wrapped.category,
          resolutionHint: wrapped.resolutionHint,
          pluginName: entry.pluginName,
          event,
        });
        if (context.flags.failFast ?? true) {
          throw wrapped;
        }
      }
    }

    const firstFailure = failures.at(0);
    if (firstFailure && (context.flags.failFast ?? true)) {
      throw firstFailure.error;
    }

    return { failures };
  }
}

export * from "./errors.js";
export * from "./logger.js";
export * from "./metrics.js";
export * from "./retry.js";
export * from "./locks.js";
export * from "./audit.js";
