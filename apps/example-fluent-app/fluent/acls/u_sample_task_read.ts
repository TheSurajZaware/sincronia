export default {
  name: "u_sample_task_read",
  table: "u_sample_task",
  operation: "read",
  roles: ["x_sincronia.user"],
  scriptInclude: "SampleTaskAcl",
};
