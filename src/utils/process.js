import { spawn } from "node:child_process";

const BINARY_HINTS = {
  "yt-dlp": "yt-dlp nao encontrado no PATH. Instale com `pip install yt-dlp` ou defina YT_DLP_PATH.",
  ffmpeg: "ffmpeg nao encontrado no PATH. Instale com `winget install Gyan.FFmpeg` ou defina FFMPEG_PATH.",
  ffprobe: "ffprobe nao encontrado no PATH. Instale com `winget install Gyan.FFmpeg` ou defina FFPROBE_PATH."
};

function describeSpawnError(command, error) {
  if (error?.code === "ENOENT") {
    const hint = BINARY_HINTS[command];
    return new Error(hint || `Executavel nao encontrado no PATH: ${command}`);
  }

  return error;
}

export async function runCommand(command, args, options = {}) {
  const { cwd, env, logStdout = false } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        ...env
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;

      if (logStdout) {
        process.stdout.write(text);
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => reject(describeSpawnError(command, error)));
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
        return;
      }

      reject(
        new Error(
          `Command failed: ${command} ${args.join(" ")}\nExit code: ${code}\n${stderr || stdout}`.trim()
        )
      );
    });
  });
}
