import type { FluentBusinessRuleDefinition } from "@sincronia/types";

const br: FluentBusinessRuleDefinition = {
  name: "u_sample_task_validate",
  table: "u_sample_task",
  when: "before",
  condition: "current.u_name.changes()",
  scriptInclude: "SampleTaskRules",
  active: true,
};

export default br;
