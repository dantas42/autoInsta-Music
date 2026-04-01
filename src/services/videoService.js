import fs from "node:fs/promises";
import path from "node:path";
import { binaryNames, videoDefaults } from "../config.js";
import { createAssSubtitleFile } from "./assService.js";
import { runCommand } from "../utils/process.js";

function escapeFilterPath(value) {
  return String(value)
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");
}

async function detectMediaType(inputPath) {
  const extension = path.extname(inputPath).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
    return "image";
  }

  return "video";
}

function buildDrawBoxFilter(entry) {
  return `drawbox=x=${entry.x}:y=${entry.y}:w=${entry.w}:h=${entry.h}:color=${entry.color}:t=fill`;
}

function buildVideoFilterChain(config) {
  const base = [
    `scale=${config.width || videoDefaults.width}:${config.height || videoDefaults.height}:force_original_aspect_ratio=increase`,
    `crop=${config.width || videoDefaults.width}:${config.height || videoDefaults.height}`,
    "setsar=1"
  ];

  for (const overlayBox of config.overlay_boxes || []) {
    base.push(buildDrawBoxFilter(overlayBox));
  }

  return base.join(",");
}

export async function renderVideo({ backgroundPath, audioPath, outputPath, config }) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const mediaType = await detectMediaType(backgroundPath);
  const videoFilterChain = buildVideoFilterChain(config);
  const subtitlePath = await createAssSubtitleFile(config);
  const subtitleFilter = `subtitles='${escapeFilterPath(subtitlePath)}'`;
  const filterChain = [videoFilterChain, subtitleFilter].filter(Boolean).join(",");
  const args = ["-y"];

  if (mediaType === "image") {
    args.push("-loop", "1");
  }

  if (mediaType === "video") {
    args.push("-stream_loop", "-1");
  }

  args.push("-i", backgroundPath, "-i", audioPath);

  args.push(
    "-t",
    String(config.duration || videoDefaults.duration),
    "-r",
    String(config.fps || videoDefaults.fps),
    "-vf",
    filterChain,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    outputPath
  );

  await runCommand(binaryNames.ffmpeg, args);
  return outputPath;
}

export async function renderCover({ backgroundPath, outputPath, config }) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const mediaType = await detectMediaType(backgroundPath);
  const videoFilterChain = buildVideoFilterChain(config);
  const subtitlePath = await createAssSubtitleFile(config);
  const filterChain = [videoFilterChain, `subtitles='${escapeFilterPath(subtitlePath)}'`].filter(Boolean).join(",");
  const args = ["-y"];

  if (mediaType === "image") {
    args.push("-loop", "1");
  }

  if (mediaType === "video") {
    args.push("-stream_loop", "-1");
  }

  args.push(
    "-i",
    backgroundPath,
    "-frames:v",
    "1",
    "-vf",
    filterChain,
    "-q:v",
    "2",
    outputPath
  );

  await runCommand(binaryNames.ffmpeg, args);
  return outputPath;
}
