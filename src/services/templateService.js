import path from "node:path";
import { paths } from "../config.js";
import { readJson } from "../utils/fs.js";

export async function loadTemplate(templateRef) {
  if (!templateRef) {
    return {};
  }

  const templatePath = path.isAbsolute(templateRef)
    ? templateRef
    : path.join(paths.templates, templateRef.endsWith(".json") ? templateRef : `${templateRef}.json`);

  return readJson(templatePath);
}
