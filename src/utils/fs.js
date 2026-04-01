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
  return String(value).replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

export function createTimestampName(prefix = "video") {
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const random = crypto.randomBytes(4).toString("hex");
  return `${sanitizeFileName(prefix) || "video"}-${date}-${random}`;
}

export function resolveFromRoot(...segments) {
  return path.resolve(process.cwd(), ...segments);
}
