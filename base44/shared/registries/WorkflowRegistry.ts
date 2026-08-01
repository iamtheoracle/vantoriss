const workflows = new Map();

export const WorkflowRegistry = {
  register(workflow) { workflows.set(workflow.name, workflow); },
  get(name) { return workflows.get(name); },
  list() { return Array.from(workflows.values()); },
  resolve(name) {
    const wf = workflows.get(name);
    if (!wf) return null;
    return { ...wf, steps: wf.steps || [] };
  },
  remove(name) { workflows.delete(name); },
};