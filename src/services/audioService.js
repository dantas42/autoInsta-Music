import path from "node:path";
import { binaryNames, paths } from "../config.js";
import { createTimestampName, ensureDir } from "../utils/fs.js";
import { runCommand } from "../utils/process.js";

export async function cutAudio(sourcePath, audioStart, duration) {
  await ensureDir(paths.temp);
  const outputPath = path.join(paths.temp, `${createTimestampName("clip")}.mp3`);

  await runCommand(binaryNames.ffmpeg, [
    "-y",
    "-ss",
    String(audioStart || 0),
    "-t",
    String(duration),
    "-i",
    sourcePath,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-ar",
    "44100",
    "-ac",
    "2",
    outputPath
  ]);

  return outputPath;
}
