import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["src", "scripts", "test"];

async function collectJsFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectJsFiles(fullPath)));
    } else if (entry.isFile() && fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = [];

for (const root of roots) {
  try {
    files.push(...(await collectJsFiles(root)));
  } catch {
    // directory not present
  }
}

let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });

  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`${result.stderr || result.stdout}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Syntax OK (${files.length} arquivos)`);