import test from "node:test";
import assert from "node:assert/strict";
import { resolveJobConfig } from "../src/services/batchService.js";

test("resolveJobConfig: job com input carrega o config do arquivo", async () => {
  const config = await resolveJobConfig({ input: "sample-input.json" });

  assert.equal(config.resolvedInputPath.endsWith("sample-input.json"), true);
  assert.ok(config.background);
  assert.ok(config.audio_source);
});

test("resolveJobConfig: job sem input remove input/overrides e nao aponta para o batch", async () => {
  const config = await resolveJobConfig({
    background: "https://example.com/bg.jpg",
    audio_source: "https://example.com/audio.mp3",
    overrides: { duration: 10 },
    slug: "inline-job"
  });

  assert.equal(config.input, undefined);
  assert.equal(config.overrides, undefined);
  assert.equal(config.resolvedInputPath, undefined);
  assert.equal(config.slug, "inline-job");
});