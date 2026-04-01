import path from "node:path";
import { paths } from "../config.js";
import { readJson } from "../utils/fs.js";

export async function loadInputConfig(inputFile) {
  const resolvedInputPath = path.isAbsolute(inputFile) ? inputFile : path.join(paths.inputs, inputFile);
  const inputConfig = await readJson(resolvedInputPath);
  return {
    ...inputConfig,
    resolvedInputPath
  };
}

export async function loadBatchConfig(batchFile) {
  const resolvedBatchPath = path.isAbsolute(batchFile) ? batchFile : path.join(paths.inputs, batchFile);
  return readJson(resolvedBatchPath);
}
