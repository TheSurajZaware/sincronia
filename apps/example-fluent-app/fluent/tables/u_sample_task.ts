import type { FluentTableDefinition } from "@sincronia/types";

const table: FluentTableDefinition = {
  name: "u_sample_task",
  label: "Sample Task",
  extends: "task",
  columns: [
    {
      name: "u_name",
      type: "string",
      mandatory: true,
      maxLength: 80,
    },
    {
      name: "u_is_ready",
      type: "boolean",
    },
  ],
};

export default table;
