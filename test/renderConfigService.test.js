import test from "node:test";
import assert from "node:assert/strict";
import { buildRenderConfig, inferOutputName, buildCoverRenderConfig } from "../src/services/renderConfigService.js";

const base = {
  background: "https://example.com/bg.jpg",
  audio_source: "https://example.com/audio.mp3"
};

test("template stylish-pop + input sem role: roles vao por indice dentro do input", async () => {
  const config = await buildRenderConfig({
    ...base,
    template: "stylish-pop",
    texts: [{ content: "Nome da musica" }, { content: "@nomedoinstagram" }]
  });

  assert.equal(config.texts.length, 2);
  assert.equal(config.texts[0].role, "title");
  assert.equal(config.texts[1].role, "subtitle");
  assert.equal(config.texts[0].content, "Nome da musica");
  assert.equal(config.texts[1].content, "@nomedoinstagram");
});

test("template stylish-pop transfere style_preset do slot para o texto do input", async () => {
  const config = await buildRenderConfig({
    ...base,
    template: "stylish-pop",
    texts: [{ content: "Nome da musica" }, { content: "@nomedoinstagram" }]
  });

  assert.equal(config.texts[0].style_preset, "hero");
  assert.equal(config.texts[1].style_preset, "subtitle");
  assert.equal(config.texts[0].font_size, 72);
});

test("preset visual vence o style_preset do template quando escolhido", async () => {
  const config = await buildRenderConfig({
    ...base,
    template: "stylish-pop",
    visual_preset: "bold-card",
    texts: [{ content: "Nome da musica" }, { content: "@nomedoinstagram" }]
  });

  assert.equal(config.texts[0].style_preset, "hero_card");
  assert.equal(config.texts[0].font_size, 86);
  assert.equal(config.overlay_boxes.length, 2);
});

test("role explicita no input e preservada mesmo com template", async () => {
  const config = await buildRenderConfig({
    ...base,
    template: "stylish-pop",
    texts: [{ content: "Handle", role: "handle" }]
  });

  assert.equal(config.texts.length, 1);
  assert.equal(config.texts[0].role, "handle");
});

test("genre_preset aplica cores por role mesmo sem role no input", async () => {
  const config = await buildRenderConfig({
    ...base,
    genre_preset: "pop",
    texts: [{ content: "Nome da musica" }, { content: "@nomedoinstagram" }]
  });

  assert.equal(config.texts[0].font_color, "0xFFF7ED");
  assert.equal(config.texts[1].font_color, "0xFDE68A");
});

test("textos vazios sao removidos da config final", async () => {
  const config = await buildRenderConfig({
    ...base,
    texts: [{ content: "Somente este permanece" }, { content: "" }]
  });

  assert.equal(config.texts.length, 1);
  assert.equal(config.texts[0].content, "Somente este permanece");
});

test("validacao: background obrigatorio", async () => {
  await assert.rejects(() => buildRenderConfig({ audio_source: "x" }), (error) => {
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /background/);
    return true;
  });
});

test("validacao: audio_source obrigatorio", async () => {
  await assert.rejects(() => buildRenderConfig({ background: "x" }), (error) => {
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /audio_source/);
    return true;
  });
});

test("validacao: duration negativa ou zero", async () => {
  await assert.rejects(() => buildRenderConfig({ ...base, duration: -5 }), (error) => {
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /duration/);
    return true;
  });

  await assert.rejects(() => buildRenderConfig({ ...base, duration: 0 }), (error) => {
    assert.equal(error.statusCode, 400);
    return true;
  });
});

test("validacao: audio_start negativa", async () => {
  await assert.rejects(() => buildRenderConfig({ ...base, audio_start: -1 }), (error) => {
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /audio_start/);
    return true;
  });
});

test("inferOutputName: output_name tem prioridade", async () => {
  const config = await buildRenderConfig({
    ...base,
    output_name: "musica-a",
    texts: [{ content: "Nome da musica" }]
  });

  assert.equal(inferOutputName(config), "musica-a");
});

test("inferOutputName: usa o titulo como fallback", async () => {
  const config = await buildRenderConfig({
    ...base,
    texts: [{ content: "Nome da musica" }]
  });

  assert.equal(inferOutputName(config), "Nome da musica");
});

test("inferOutputName: cai no nome do arquivo de input", async () => {
  const config = await buildRenderConfig({
    ...base
  }, { resolvedInputPath: "inputs/minha-faixa.json" });

  assert.equal(inferOutputName(config), "minha-faixa");
});

test("buildCoverRenderConfig: usa titulo do cover ou do video", async () => {
  const config = await buildRenderConfig({
    ...base,
    texts: [{ content: "Nome da musica", role: "title" }],
    cover: { title: "Titulo da capa" }
  });

  const coverConfig = buildCoverRenderConfig(config);

  assert.equal(coverConfig.duration, 1);
  assert.equal(coverConfig.texts[0].content, "Titulo da capa");
  assert.equal(coverConfig.texts[0].animation, null);
  assert.equal(coverConfig.watermark.enabled, false);
});