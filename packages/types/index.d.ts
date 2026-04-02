export type SincroniaInstance = {
  name: string;
  instanceUrl: string;
  authProfile?: string;
  username?: string;
  passwordEnvVar?: string;
};

export type SincroniaEnvironmentPolicy = {
  protected?: boolean;
  requireConfirmation?: boolean;
  allowedBranches?: string[];
};

export type SincroniaEnvironment = {
  instances: SincroniaInstance[];
  policy?: SincroniaEnvironmentPolicy;
};

export type LegacySincroniaEnvironment = {
  instanceUrl: string;
  authProfile?: string;
  username?: string;
  passwordEnvVar?: string;
};

export type SincroniaConfig = {
  defaultEnvironment: string;
  sdkCommand?: string[];
  appRoot: string;
  environments: Record<
    string,
    SincroniaEnvironment | LegacySincroniaEnvironment
  >;
};

export type FluentTableDefinition = {
  name: string;
  label: string;
  extends?: string;
  columns: Array<{
    name: string;
    type: "string" | "integer" | "boolean" | "reference";
    reference?: string;
    mandatory?: boolean;
    maxLength?: number;
  }>;
};

export type FluentBusinessRuleDefinition = {
  name: string;
  table: string;
  when: "before" | "after" | "async";
  condition?: string;
  scriptInclude: string;
  active?: boolean;
};
