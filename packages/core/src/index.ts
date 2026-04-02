import { z } from "zod";

export type CommandExecutionContext = {
  cwd: string;
  rootDir: string;
  args: Record<string, unknown>;
  options: {
    env?: string;
    watch?: boolean;
  };
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

const environmentSchema = z.object({
  instanceUrl: z.string().url(),
  authProfile: z.string().optional(),
  username: z.string().optional(),
  passwordEnvVar: z.string().optional(),
});

export const runtimeConfigSchema = z.object({
  defaultEnvironment: z.string().default("dev"),
  sdkCommand: z.array(z.string()).min(1).default(["npx", "@servicenow/sdk"]),
  appRoot: z.string().default("apps/example-fluent-app"),
  environments: z.record(environmentSchema),
});

export class PluginManager {
  private hooks = new Map<LifecycleEvent, PluginHook[]>();

  registerPlugin(plugin: SincroniaPlugin): void {
    const api: PluginApi = {
      registerHook: (event, hook) => {
        const existing = this.hooks.get(event) ?? [];
        existing.push(hook);
        this.hooks.set(event, existing);
      },
    };

    plugin.setup?.(api);

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
  ): Promise<void> {
    const hooks = this.hooks.get(event) ?? [];
    for (const hook of hooks) {
      await hook(context);
    }
  }
}
