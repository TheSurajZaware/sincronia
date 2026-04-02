import type { SincroniaConfig } from "@sincronia/types";

const config: SincroniaConfig = {
  defaultEnvironment: "dev",
  sdkCommand: ["npx", "@servicenow/sdk"],
  appRoot: "apps/example-fluent-app",
  environments: {
    dev: {
      instances: [
        {
          name: "dev-primary",
          instanceUrl: "https://dev00000.service-now.com",
          authProfile: "dev",
        },
      ],
      policy: {
        protected: false,
        requireConfirmation: false,
        allowedBranches: ["*"],
      },
    },
    qa: {
      instances: [
        {
          name: "qa-primary",
          instanceUrl: "https://qa00000.service-now.com",
          authProfile: "qa",
        },
      ],
      policy: {
        protected: false,
        requireConfirmation: true,
        allowedBranches: ["main", "release/*"],
      },
    },
    stage: {
      instances: [
        {
          name: "stage-primary",
          instanceUrl: "https://stage00000.service-now.com",
          authProfile: "stage",
        },
      ],
      policy: {
        protected: true,
        requireConfirmation: true,
        allowedBranches: ["main", "release/*"],
      },
    },
    prod: {
      instances: [
        {
          name: "prod-primary",
          instanceUrl: "https://prod00000.service-now.com",
          authProfile: "prod",
        },
      ],
      policy: {
        protected: true,
        requireConfirmation: true,
        allowedBranches: ["main"],
      },
    },
  },
};

export default config;
