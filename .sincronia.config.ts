import type { SincroniaConfig } from "@sincronia/types";

const config: SincroniaConfig = {
  defaultEnvironment: "dev",
  sdkCommand: ["npx", "@servicenow/sdk"],
  appRoot: "apps/example-fluent-app",
  environments: {
    dev: {
      instanceUrl: "https://dev00000.service-now.com",
      authProfile: "dev",
    },
    qa: {
      instanceUrl: "https://qa00000.service-now.com",
      authProfile: "qa",
    },
    prod: {
      instanceUrl: "https://prod00000.service-now.com",
      authProfile: "prod",
    },
  },
};

export default config;
