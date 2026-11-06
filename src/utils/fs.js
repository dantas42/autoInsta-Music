import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function writeJson(filePath, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, json, "utf8");
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFileName(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function createTimestampName(prefix = "video") {
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const random = crypto.randomBytes(4).toString("hex");
  return `${sanitizeFileName(prefix) || "video"}-${date}-${random}`;
}

export function resolveFromRoot(...segments) {
  return path.resolve(process.cwd(), ...segments);
}

export async function cleanupTempFiles(dirPath, maxAgeMs = 24 * 60 * 60 * 1000) {
  let entries;

  try {
    entries = await fs.readdir(dirPath);
  } catch {
    return 0;
  }

  const now = Date.now();
  let removed = 0;

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);

    try {
      const stats = await fs.stat(fullPath);

      if (!stats.isFile()) {
        continue;
      }

      if (now - stats.mtimeMs >= maxAgeMs) {
        await fs.unlink(fullPath);
        removed += 1;
      }
    } catch {}
  }

  return removed;
}