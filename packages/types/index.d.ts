export type SincroniaEnvironment = {
  instanceUrl: string;
  authProfile?: string;
  username?: string;
  passwordEnvVar?: string;
};

export type SincroniaConfig = {
  defaultEnvironment: string;
  sdkCommand?: string[];
  appRoot: string;
  environments: Record<string, SincroniaEnvironment>;
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
