import { paths } from "./config.js";
import { logger } from "./logger.js";
import { ensureDir } from "./utils/fs.js";
import { prepareAudio, prepareBackground, buildOutputPath } from "./services/assetService.js";
import { cutAudio } from "./services/audioService.js";
import { loadInputConfig } from "./services/inputLoader.js";
import { buildCoverRenderConfig, buildRenderConfig, inferOutputName } from "./services/renderConfigService.js";
import { renderCover, renderVideo } from "./services/videoService.js";

export async function generateFromConfig(config, options = {}) {
  const normalized = await buildRenderConfig(config, options);
  const shouldGenerateCover = Boolean(normalized.generate_cover);

  await ensureDir(paths.assets);
  await ensureDir(paths.outputs);
  await ensureDir(paths.temp);
  await ensureDir(paths.inputs);
  await ensureDir(paths.templates);

  logger.info("Preparando background");
  const backgroundPath = await prepareBackground(normalized.background);

  logger.info("Preparando audio");
  const rawAudioPath = await prepareAudio(normalized.audio_source);

  logger.info("Recortando audio", {
    audio_start: normalized.audio_start,
    duration: normalized.duration
  });
  const clippedAudioPath = await cutAudio(rawAudioPath, normalized.audio_start, normalized.duration);

  const outputPath = buildOutputPath(inferOutputName(normalized));
  const coverOutputPath = shouldGenerateCover ? outputPath.replace(/\.mp4$/i, "-cover.jpg") : null;

  logger.info("Renderizando video", { outputPath });
  await renderVideo({
    backgroundPath,
    audioPath: clippedAudioPath,
    outputPath,
    config: normalized
  });

  if (shouldGenerateCover && coverOutputPath) {
    logger.info("Renderizando capa", { coverOutputPath });
    await renderCover({
      backgroundPath,
      outputPath: coverOutputPath,
      config: buildCoverRenderConfig(normalized)
    });
  }

  logger.info("Video gerado com sucesso", { outputPath });

  return {
    outputPath,
    coverOutputPath,
    backgroundPath,
    audioPath: clippedAudioPath
  };
}

export async function generateFromFile(inputFile, options = {}) {
  const config = await loadInputConfig(inputFile);
  return generateFromConfig(config, {
    ...options,
    resolvedInputPath: config.resolvedInputPath
  });
}
