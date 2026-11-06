import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { sanitizeFileName, createTimestampName, cleanupTempFiles } from "../src/utils/fs.js";

test("sanitizeFileName: remove acentos corretamente", () => {
  assert.equal(sanitizeFileName("Música do Coração!"), "musica-do-coracao");
  assert.equal(sanitizeFileName("Jão - Café & Sol"), "jao-cafe-sol");
});

test("sanitizeFileName: tolera valores vazios", () => {
  assert.equal(sanitizeFileName(""), "");
  assert.equal(sanitizeFileName("   "), "");
});

test("sanitizeFileName: mantem hifen e underscore", () => {
  assert.equal(sanitizeFileName("A-B_c"), "a-b_c");
});

test("createTimestampName: prefixo sanitizado + timestamp + random", () => {
  const name = createTimestampName("Música");
  assert.match(name, /^musica-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-f0-9]{8}$/);
});

test("cleanupTempFiles: remove apenas arquivos com idade acima do maxAge", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "autoinsta-cleanup-"));
  const oldFile = path.join(dir, "old.bin");
  const newFile = path.join(dir, "new.bin");
  await fs.writeFile(oldFile, "a");
  await fs.writeFile(newFile, "b");

  const past = Date.now() - 24 * 60 * 60 * 1000 - 1000;
  await fs.utimes(oldFile, new Date(past), new Date(past));

  const removed = await cleanupTempFiles(dir, 24 * 60 * 60 * 1000);

  assert.equal(removed, 1);
  assert.equal(await fs.readdir(dir).then((files) => files.length), 1);
  await fs.rm(dir, { recursive: true, force: true });
});

test("cleanupTempFiles: diretorio inexistente retorna 0", async () => {
  const removed = await cleanupTempFiles(path.join(os.tmpdir(), "nao-existe-zzz"));
  assert.equal(removed, 0);
});