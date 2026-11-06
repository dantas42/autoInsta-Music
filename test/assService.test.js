import test from "node:test";
import assert from "node:assert/strict";
import { parseManualCoordinate, buildDialogue } from "../src/services/assService.js";

test("parseManualCoordinate: numeros e strings numericas", () => {
  assert.equal(parseManualCoordinate(420), 420);
  assert.equal(parseManualCoordinate("60"), 60);
  assert.equal(parseManualCoordinate("120-(text_w/2)"), 120);
});

test("parseManualCoordinate: valores nao numericos retornam null", () => {
  assert.equal(parseManualCoordinate("center"), null);
  assert.equal(parseManualCoordinate("auto"), null);
  assert.equal(parseManualCoordinate(""), null);
  assert.equal(parseManualCoordinate(null), null);
  assert.equal(parseManualCoordinate(undefined), null);
  assert.equal(parseManualCoordinate("abc"), null);
});

test("buildDialogue: ambas coordenadas manuais usam manual_anchor (top-left -> an7)", () => {
  const line = buildDialogue("Style1", { content: "X", x: 60, y: 80 }, 20, 1080, 1920);
  assert.match(line, /\\an7\\pos\(60,80\)/);
});

test("buildDialogue: ambas coordenadas + manual_anchor center", () => {
  const line = buildDialogue("Style1", { content: "X", x: 100, y: 200, manual_anchor: "center" }, 20, 1080, 1920);
  assert.match(line, /\\an5\\pos\(100,200\)/);
});

test("buildDialogue: y manual com x 'center' cai no anchor (regressao da parcial)", () => {
  const line = buildDialogue("Style1", { content: "X", x: "center", y: 420 }, 20, 1080, 1920);
  assert.match(line, /\\an5\\pos\(540,420\)/);
});

test("buildDialogue: apenas x manual mantem y do anchor", () => {
  const line = buildDialogue("Style1", { content: "X", x: 60 }, 20, 1080, 1920);
  assert.match(line, /\\an5\\pos\(60,960\)/);
});

test("buildDialogue: apenas y manual mantem x do anchor", () => {
  const line = buildDialogue("Style1", { content: "X", y: 300 }, 20, 1080, 1920);
  assert.match(line, /\\an5\\pos\(540,300\)/);
});

test("buildDialogue: sem coordenadas usa anchor", () => {
  const line = buildDialogue("Style1", { content: "X", anchor: "bottom-left", margin_x: 40, margin_y: 60 }, 20, 1080, 1920);
  assert.match(line, /\\an1\\pos\(40,1860\)/);
});

test("buildDialogue: texto escapa chaves e contracos", () => {
  const line = buildDialogue("Style1", { content: "A{B}\\C", x: 10, y: 10 }, 20, 1080, 1920);
  const escapedContent = "A" + "\\{" + "B" + "\\}" + "\\\\" + "C";
  assert.ok(line.endsWith(escapedContent));
});