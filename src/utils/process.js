import { spawn } from "node:child_process";

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

    child.on("error", reject);
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
