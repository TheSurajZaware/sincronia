import fs from "node:fs/promises";
import path from "node:path";

type GeneratorType = "table" | "br" | "api";

const templates: Record<GeneratorType, (name: string) => string> = {
  table: (name) => `export default {
  name: "${name}",
  label: "${name.replaceAll("_", " ")}",
  extends: "task",
  columns: [
    { name: "u_name", type: "string", mandatory: true, maxLength: 80 }
  ]
};
`,
  br: (name) => `export default {
  name: "${name}",
  table: "u_sample_task",
  when: "before",
  condition: "current.u_name.changes()",
  scriptInclude: "SampleTaskRules",
  active: true
};
`,
  api: (name) => `export default {
  name: "${name}",
  resourcePath: "/${name}",
  methods: ["get"],
  scriptInclude: "SampleApiHandler"
};
`,
};

export const generateFluentArtifact = async (
  appRoot: string,
  type: GeneratorType,
  name: string,
): Promise<string> => {
  const directoryByType: Record<GeneratorType, string> = {
    table: "fluent/tables",
    br: "fluent/business-rules",
    api: "fluent/rest-apis",
  };
  const output = path.join(appRoot, directoryByType[type], `${name}.ts`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, templates[type](name), "utf8");
  return output;
};
