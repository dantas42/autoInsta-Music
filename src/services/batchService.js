import path from "node:path";
import { loadBatchConfig, loadInputConfig } from "./inputLoader.js";
import { generateFromConfig } from "../generator.js";

export async function runBatch(batchFile, options = {}) {
  const batchConfig = await loadBatchConfig(batchFile);
  const jobs = Array.isArray(batchConfig.jobs) ? batchConfig.jobs : batchConfig;

  if (!Array.isArray(jobs) || jobs.length === 0) {
    throw new Error("Nenhum job encontrado no arquivo de batch.");
  }

  const results = [];

  for (const job of jobs) {
    const config = job.input
      ? await loadInputConfig(job.input)
      : { ...job, resolvedInputPath: path.resolve(process.cwd(), batchFile) };

    const result = await generateFromConfig({
      ...config,
      ...job.overrides
    }, options);

    results.push(result);
  }

  return results;
}
