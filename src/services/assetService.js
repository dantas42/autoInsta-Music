import fs from "node:fs/promises";
import path from "node:path";
import { binaryNames, paths } from "../config.js";
import { downloadFile } from "../utils/download.js";
import { createTimestampName, ensureDir, fileExists, sanitizeFileName } from "../utils/fs.js";
import { runCommand } from "../utils/process.js";

function inferExtensionFromUrl(url, fallback) {
  try {
    const parsed = new URL(url);
    const extension = path.extname(parsed.pathname);
    return extension || fallback;
  } catch {
    return fallback;
  }
}

function inferExtensionFromContentType(contentType, fallback) {
  const normalized = String(contentType || "").toLowerCase();

  if (normalized.includes("image/jpeg")) {
    return ".jpg";
  }

  if (normalized.includes("image/png")) {
    return ".png";
  }

  if (normalized.includes("image/webp")) {
    return ".webp";
  }

  if (normalized.includes("video/mp4")) {
    return ".mp4";
  }

  if (normalized.includes("video/quicktime")) {
    return ".mov";
  }

  return fallback;
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function isYouTubeUrl(value) {
  return /(?:youtube\.com|youtu\.be)/i.test(value);
}

export async function prepareBackground(background) {
  if (!background) {
    throw new Error("O campo background e obrigatorio.");
  }

  await ensureDir(paths.assets);
  await ensureDir(paths.temp);

  if (!isRemoteUrl(background)) {
    const localPath = path.isAbsolute(background) ? background : path.resolve(process.cwd(), background);

    if (!(await fileExists(localPath))) {
      throw new Error(`Background nao encontrado: ${localPath}`);
    }

    return localPath;
  }

  let extension = inferExtensionFromUrl(background, "");

  if (!extension) {
    try {
      const response = await fetch(background, { method: "HEAD", signal: AbortSignal.timeout(10_000) });
      extension = inferExtensionFromContentType(response.headers.get("content-type"), ".bin");
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        throw new Error(`Tempo esgotado ao verificar o background: ${background}`);
      }

      throw error;
    }
  }

  const filename = `${createTimestampName("background")}${extension}`;
  const destination = path.join(paths.temp, filename);
  await downloadFile(background, destination);
  return destination;
}

export async function prepareAudio(audioSource) {
  if (!audioSource) {
    throw new Error("O campo audio_source e obrigatorio.");
  }

  await ensureDir(paths.temp);

  if (isRemoteUrl(audioSource) && isYouTubeUrl(audioSource)) {
    const outputTemplate = path.join(paths.temp, `${createTimestampName("audio")}.%(ext)s`);

    await runCommand(binaryNames.ytDlp, [
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
      "--no-playlist",
      "--output",
      outputTemplate,
      audioSource
    ]);

    const files = await fs.readdir(paths.temp);
    const matches = files
      .filter((file) => file.startsWith(path.basename(outputTemplate).replace(".%(ext)s", "")))
      .map((file) => path.join(paths.temp, file));

    if (matches.length === 0) {
      throw new Error("yt-dlp concluiu sem retornar um arquivo de audio.");
    }

    return matches[0];
  }

  if (isRemoteUrl(audioSource)) {
    const extension = inferExtensionFromUrl(audioSource, ".mp3");
    const destination = path.join(paths.temp, `${createTimestampName("audio")}${extension}`);
    await downloadFile(audioSource, destination);
    return destination;
  }

  const localPath = path.isAbsolute(audioSource) ? audioSource : path.resolve(process.cwd(), audioSource);

  if (!(await fileExists(localPath))) {
    throw new Error(`Audio nao encontrado: ${localPath}`);
  }

  return localPath;
}

export async function buildOutputPath(outputName) {
  const baseName = sanitizeFileName(outputName || createTimestampName("reel")) || createTimestampName("reel");
  let candidate = path.join(paths.outputs, `${baseName}.mp4`);
  let counter = 2;

  while (await fileExists(candidate)) {
    candidate = path.join(paths.outputs, `${baseName}-${counter}.mp4`);
    counter += 1;
  }

  return candidate;
}
