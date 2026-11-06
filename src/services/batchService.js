import { loadBatchConfig, loadInputConfig } from "./inputLoader.js";
import { generateFromConfig } from "../generator.js";
import { logger } from "../logger.js";

export async function resolveJobConfig(job) {
  if (job.input) {
    return await loadInputConfig(job.input);
  }

  const { input, overrides, ...inlineConfig } = job;
  return inlineConfig;
}

export async function runBatch(batchFile, options = {}) {
  const batchConfig = await loadBatchConfig(batchFile);
  const jobs = Array.isArray(batchConfig.jobs) ? batchConfig.jobs : batchConfig;

  if (!Array.isArray(jobs) || jobs.length === 0) {
    throw new Error("Nenhum job encontrado no arquivo de batch.");
  }

  const results = [];
  const failures = [];

  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index];

    try {
      const config = await resolveJobConfig(job);
      const result = await generateFromConfig(
        {
          ...config,
          ...job.overrides
        },
        options
      );
      results.push({ ok: true, index, ...result });
    } catch (error) {
      failures.push({ ok: false, index, message: error.message });
      logger.warn(`Job ${index + 1} falhou`, { message: error.message });
    }
  }

  if (failures.length > 0) {
    const error = new Error(`Batch concluido com ${failures.length} falha(s) de ${jobs.length}.`);
    error.failures = failures;
    error.results = results;
    throw error;
  }

  return results;
}