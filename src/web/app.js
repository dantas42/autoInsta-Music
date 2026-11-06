const form = document.querySelector("#generator-form");
const statusText = document.querySelector("#status-text");
const outputsList = document.querySelector("#outputs-list");
const phoneScreen = document.querySelector("#phone-screen");
const coverScreen = document.querySelector("#cover-screen");
const titleNode = document.querySelector("#preview-title");
const subtitleNode = document.querySelector("#preview-subtitle");
const handleNode = document.querySelector("#preview-handle");
const watermarkNode = document.querySelector("#preview-watermark");
const sourceBadgeNode = document.querySelector("#preview-source-badge");
const coverTitleNode = document.querySelector("#cover-title");
const coverSubtitleNode = document.querySelector("#cover-subtitle");
const coverSourceBadgeNode = document.querySelector("#cover-source-badge");
const outputsToggle = document.querySelector("#outputs-toggle");
const outputsPanel = document.querySelector("#outputs-panel");
const resetLayoutButton = document.querySelector("#reset-layout");
const clearManualConfigButton = document.querySelector("#clear-manual-config");
const applyBaseConfigButton = document.querySelector("#apply-base-config");
const openLatestVideoButton = document.querySelector("#open-latest-video");
const openOutputFolderButton = document.querySelector("#open-output-folder");
const editorPanel = document.querySelector(".editor-panel");
const editorHud = document.querySelector("#editor-hud");
const sidebarShell = document.querySelector("#sidebar-shell");
const sidebarToggle = document.querySelector("#sidebar-toggle");

let outputsExpanded = false;
let dragging = null;
let activeRole = "title";
let latestOutputs = [];

const layers = {
  title: { node: titleNode, xInput: "title_x", yInput: "title_y", sizeInput: "title_size", widthMode: "wide", manualAnchor: "center" },
  subtitle: { node: subtitleNode, xInput: "subtitle_x", yInput: "subtitle_y", sizeInput: "subtitle_size", widthMode: "medium", manualAnchor: "center" },
  handle: { node: handleNode, xInput: "handle_x", yInput: "handle_y", sizeInput: "handle_size", widthMode: "auto", manualAnchor: "top-left" },
  watermark: { node: watermarkNode, xInput: "watermark_x", yInput: "watermark_y", sizeInput: "watermark_size", widthMode: "auto", manualAnchor: "top-left" }
};

const baseSizeByPreset = {
  spotlight: { title: 80, subtitle: 34, handle: 28, watermark: 24 },
  "bold-card": { title: 86, subtitle: 34, handle: 28, watermark: 24 },
  "midnight-glass": { title: 80, subtitle: 34, handle: 28, watermark: 24 },
  "neon-pulse": { title: 88, subtitle: 34, handle: 28, watermark: 24 },
  editorial: { title: 82, subtitle: 30, handle: 28, watermark: 24 },
  "lower-third": { title: 74, subtitle: 28, handle: 28, watermark: 24 },
  "lower-third-right": { title: 74, subtitle: 28, handle: 28, watermark: 24 },
  poster: { title: 94, subtitle: 30, handle: 28, watermark: 24 },
  minimal: { title: 78, subtitle: 32, handle: 28, watermark: 24 }
};

const sourceBadgeMap = {
  spotify: "Spotify",
  youtube: "YouTube",
  soundcloud: "SoundCloud"
};

function safeCssUrl(value) {
  try {
    const url = new URL(String(value || "").trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.href.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/[\u0000-\u001f]/g, "");
  } catch {
    return "";
  }
}

async function loadTemplates() {
  try {
    const response = await fetch("/api/templates");
    const data = await response.json();
    const select = form.elements.namedItem("template");

    for (const file of data.templates || []) {
      const option = document.createElement("option");
      option.value = file.replace(/\.json$/i, "");
      option.textContent = option.value;
      select.append(option);
    }
  } catch {}
}

function setLayerMarkup(node, text) {
  node.innerHTML = "";
  const label = document.createElement("span");
  label.className = "layer-label";
  label.textContent = text;
  const resize = document.createElement("span");
  resize.className = "resize-hit";
  resize.setAttribute("aria-hidden", "true");
  node.append(label, resize);
}

function setStaticLayerText(node, text) {
  node.textContent = text || "";
}

function setStatus(message, kind = "idle") {
  statusText.textContent = message;
  statusText.className = `status ${kind}`;
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

async function loadOutputs() {
  if (!outputsPanel.open) {
    outputsList.innerHTML = "";
    outputsToggle.hidden = true;
    return;
  }

  const response = await fetch("/api/outputs");
  const data = await response.json();
  latestOutputs = data.outputs || [];
  outputsList.innerHTML = "";

  if (latestOutputs.length === 0) {
    outputsList.innerHTML = `<div class="output-item"><div><div class="output-name">Nenhum video ainda</div><div class="output-meta">A primeira geracao aparecera aqui.</div></div></div>`;
    return;
  }

  const visibleOutputs = outputsExpanded ? latestOutputs : latestOutputs.slice(0, 4);

  for (const output of visibleOutputs) {
    const item = document.createElement("div");
    item.className = "output-item";

    const detailsWrap = document.createElement("details");
    detailsWrap.className = "output-details";
    const summary = document.createElement("summary");
    summary.textContent = "Detalhes";
    const pathDiv = document.createElement("div");
    pathDiv.className = "output-path";
    pathDiv.textContent = output.path;
    detailsWrap.append(summary, pathDiv);

    const side = document.createElement("div");
    side.className = "output-side";
    const sizeDiv = document.createElement("div");
    sizeDiv.className = "output-meta";
    sizeDiv.textContent = formatBytes(output.size);
    side.append(sizeDiv, detailsWrap);

    const main = document.createElement("div");
    const nameDiv = document.createElement("div");
    nameDiv.className = "output-name";
    nameDiv.textContent = output.name;
    const dateDiv = document.createElement("div");
    dateDiv.className = "output-meta";
    dateDiv.textContent = new Date(output.createdAt).toLocaleString("pt-BR");
    main.append(nameDiv, dateDiv);

    item.append(main, side);
    outputsList.append(item);
  }

  if (latestOutputs.length > 4) {
    outputsToggle.hidden = false;
    outputsToggle.textContent = outputsExpanded ? "Mostrar menos" : `Mostrar mais (${latestOutputs.length - 4})`;
  } else {
    outputsToggle.hidden = true;
  }
}

function getNumericField(name) {
  const field = form.elements.namedItem(name);
  const value = field?.value;
  return value === "" || value == null ? null : Number(value);
}

function getFieldValue(name) {
  return new FormData(form).get(name) || "";
}

function isChecked(name) {
  const field = form.elements.namedItem(name);
  return Boolean(field?.checked);
}

function setFieldValue(name, value) {
  const field = form.elements.namedItem(name);
  if (field) {
    field.value = value ?? "";
  }
}

function updateHud(role = activeRole) {
  const layer = layers[role];
  const x = getNumericField(layer.xInput) ?? "auto";
  const y = getNumericField(layer.yInput) ?? "auto";
  const size = getNumericField(layer.sizeInput) ?? "auto";
  editorHud.textContent = `${role} | x: ${x} | y: ${y} | size: ${size}`;
}

function setActiveRole(role) {
  activeRole = role;

  Object.entries(layers).forEach(([layerRole, layer]) => {
    layer.node.classList.toggle("is-active", layerRole === role);
  });

  document.querySelectorAll("[data-role-control]").forEach((element) => {
    element.classList.toggle("is-active-control", element.dataset.roleControl === role);
  });

  updateHud(role);
}

function applyManualPosition(role) {
  const layer = layers[role];
  const x = getNumericField(layer.xInput);
  const y = getNumericField(layer.yInput);
  const size = getNumericField(layer.sizeInput);
  const node = layer.node;
  const isManual = x != null && y != null;

  node.style.left = "";
  node.style.right = "";
  node.style.top = "";
  node.style.bottom = "";
  node.style.transform = "";
  node.style.width = "";
  node.style.maxWidth = "";
  node.style.fontSize = "";

  if (!isManual && layer.widthMode === "wide") {
    node.style.width = "calc(100% - 44px)";
  } else if (!isManual && layer.widthMode === "medium") {
    node.style.width = "calc(100% - 80px)";
  } else if (isManual && (layer.widthMode === "wide" || layer.widthMode === "medium")) {
    node.style.width = "fit-content";
    node.style.maxWidth = layer.widthMode === "wide" ? "78%" : "68%";
  }

  if (size) {
    node.style.fontSize = `${Math.max(12, (size / 1080) * phoneScreen.clientWidth)}px`;
  }

  if (!isManual) {
    return false;
  }

  const previewX = (x / 1080) * phoneScreen.clientWidth;
  const previewY = (y / 1920) * phoneScreen.clientHeight;
  node.style.left = `${previewX}px`;
  node.style.top = `${previewY}px`;
  node.style.transform = layer.manualAnchor === "center" ? "translate(-50%, -50%)" : "translate(0, 0)";

  if (layer.widthMode === "auto") {
    node.style.width = "auto";
  }

  return true;
}

function syncManualPositionsToPreview() {
  Object.keys(layers).forEach((role) => {
    applyManualPosition(role);
  });
  updateHud(activeRole);
}

function getAnimationConfig(value) {
  if (value === "preset") {
    return undefined;
  }

  if (value === "none") {
    return null;
  }

  return {
    type: value,
    duration_ms: 380,
    distance: 42,
    fade_in_ms: 240
  };
}

function applyBaseConfig() {
  const preset = getFieldValue("visual_preset") || "spotlight";
  const sizes = baseSizeByPreset[preset] || baseSizeByPreset.spotlight;

  setFieldValue("title_size", sizes.title);
  setFieldValue("subtitle_size", sizes.subtitle);
  setFieldValue("handle_size", sizes.handle);
  setFieldValue("watermark_size", sizes.watermark);
  clearManualPositions(false);
  updatePreview();
}

function clearManualPositions(refresh = true) {
  ["title_x", "title_y", "subtitle_x", "subtitle_y", "handle_x", "handle_y", "watermark_x", "watermark_y"].forEach((name) =>
    setFieldValue(name, "")
  );

  if (refresh) {
    updatePreview();
  }
}

function clearManualAdjustments() {
  ["title_x", "title_y", "subtitle_x", "subtitle_y", "handle_x", "handle_y", "watermark_x", "watermark_y", "title_size", "subtitle_size", "handle_size", "watermark_size"].forEach(
    (name) => setFieldValue(name, "")
  );
  updatePreview();
}

function updatePresetClasses(screen, visualPreset) {
  screen.classList.remove(
    "preset-spotlight",
    "preset-minimal",
    "preset-bold-card",
    "preset-midnight-glass",
    "preset-neon-pulse",
    "preset-editorial",
    "preset-lower-third",
    "preset-lower-third-right",
    "preset-poster"
  );
  screen.classList.add(`preset-${visualPreset}`);
}

function updatePreview() {
  const heroText = getFieldValue("hero_text") || "";
  const subtitleText = getFieldValue("subtitle_text") || "";
  const handleText = getFieldValue("handle_text") || "";
  const watermarkText = getFieldValue("watermark_content") || "";
  const background = getFieldValue("background") || "";
  const visualPreset = getFieldValue("visual_preset") || "spotlight";
  const shouldGenerateCover = isChecked("generate_cover");
  const coverTitle = getFieldValue("cover_title") || heroText;
  const coverSubtitle = getFieldValue("cover_subtitle") || subtitleText;
  const sourcePlatform = getFieldValue("source_platform");
  const sourceLabel = sourceBadgeMap[sourcePlatform] || "";

  setLayerMarkup(titleNode, heroText);
  setLayerMarkup(subtitleNode, subtitleText);
  setLayerMarkup(handleNode, handleText);
  setLayerMarkup(watermarkNode, watermarkText);
  setStaticLayerText(coverTitleNode, coverTitle);
  setStaticLayerText(coverSubtitleNode, coverSubtitle);
  setStaticLayerText(sourceBadgeNode, sourceLabel);
  setStaticLayerText(coverSourceBadgeNode, sourceLabel);

  const gradient = "linear-gradient(to top, rgba(5, 8, 14, 0.82) 0%, rgba(5, 8, 14, 0.25) 45%, rgba(5, 8, 14, 0.05) 100%)";
  const cssUrl = safeCssUrl(background);
  const backgroundImage = cssUrl ? `${gradient}, url('${cssUrl}')` : gradient;

  phoneScreen.style.backgroundImage = backgroundImage;
  coverScreen.style.backgroundImage = backgroundImage;
  coverScreen.parentElement.closest(".preview-card").hidden = !shouldGenerateCover;

  sourceBadgeNode.classList.toggle("is-visible", Boolean(sourceLabel));
  coverSourceBadgeNode.classList.toggle("is-visible", Boolean(sourceLabel));

  updatePresetClasses(phoneScreen, visualPreset);
  updatePresetClasses(coverScreen, visualPreset);
  syncManualPositionsToPreview();
}

function buildPayload() {
  const visualPreset = getFieldValue("visual_preset") || "spotlight";
  const titleAnimation = getAnimationConfig(getFieldValue("title_animation") || "preset");
  const subtitleAnimation = getAnimationConfig(getFieldValue("subtitle_animation") || "preset");

  const titleSize = getNumericField("title_size");
  const subtitleSize = getNumericField("subtitle_size");
  const handleSize = getNumericField("handle_size");
  const watermarkSize = getNumericField("watermark_size");
  const titleX = getNumericField("title_x");
  const titleY = getNumericField("title_y");
  const subtitleX = getNumericField("subtitle_x");
  const subtitleY = getNumericField("subtitle_y");
  const handleX = getNumericField("handle_x");
  const handleY = getNumericField("handle_y");
  const watermarkX = getNumericField("watermark_x");
  const watermarkY = getNumericField("watermark_y");

  return {
    background: getFieldValue("background"),
    audio_source: getFieldValue("audio_source"),
    audio_start: Number(getFieldValue("audio_start") || 0),
    duration: Number(getFieldValue("duration") || 20),
    template: getFieldValue("template") || undefined,
    visual_preset: visualPreset,
    genre_preset: getFieldValue("genre_preset") || undefined,
    source_platform: getFieldValue("source_platform") || undefined,
    generate_cover: isChecked("generate_cover"),
    cover: {
      title: getFieldValue("cover_title") || undefined,
      subtitle: getFieldValue("cover_subtitle") || undefined
    },
    texts: [
      {
        content: getFieldValue("hero_text"),
        role: "title",
        ...(titleAnimation !== undefined ? { animation: titleAnimation } : {}),
        ...(titleSize != null ? { font_size: titleSize } : {}),
        ...(titleX != null && titleY != null ? { x: titleX, y: titleY, manual_anchor: "center" } : {})
      },
      {
        content: getFieldValue("subtitle_text"),
        role: "subtitle",
        ...(subtitleAnimation !== undefined ? { animation: subtitleAnimation } : {}),
        ...(subtitleSize != null ? { font_size: subtitleSize } : {}),
        ...(subtitleX != null && subtitleY != null ? { x: subtitleX, y: subtitleY, manual_anchor: "center" } : {})
      },
      {
        content: getFieldValue("handle_text"),
        role: "handle",
        ...(handleSize != null ? { font_size: handleSize } : {}),
        ...(handleX != null && handleY != null ? { x: handleX, y: handleY, manual_anchor: "top-left" } : {})
      }
    ],
    watermark: {
      enabled: true,
      content: getFieldValue("watermark_content"),
      ...(watermarkSize != null ? { font_size: watermarkSize } : {}),
      ...(watermarkX != null && watermarkY != null ? { x: watermarkX, y: watermarkY, manual_anchor: "top-left" } : {})
    }
  };
}

async function postJson(url) {
  const response = await fetch(url, { method: "POST" });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Falha na acao.");
  }

  return data;
}

function startInteraction(role, event) {
  event.preventDefault();
  setActiveRole(role);
  const rect = phoneScreen.getBoundingClientRect();
  const nodeRect = layers[role].node.getBoundingClientRect();
  const layer = layers[role];
  const isResize = event.target.closest(".resize-hit") || layer.node.classList.contains("is-resize-hover");

  dragging = {
    role,
    mode: isResize ? "resize" : "move",
    startClientX: event.clientX,
    startClientY: event.clientY,
    startSize: getNumericField(layer.sizeInput) || 48,
    offsetX: layer.manualAnchor === "center" ? event.clientX - (nodeRect.left + nodeRect.width / 2) : event.clientX - nodeRect.left,
    offsetY: layer.manualAnchor === "center" ? event.clientY - (nodeRect.top + nodeRect.height / 2) : event.clientY - nodeRect.top,
    bounds: rect
  };

  phoneScreen.classList.add("is-dragging");
}

function updateResizeHotspot(role, event) {
  const nodeRect = layers[role].node.getBoundingClientRect();
  const isHot = event.clientX > nodeRect.right - 18 && event.clientY > nodeRect.bottom - 18;
  layers[role].node.classList.toggle("is-resize-hover", isHot);
}

function onPointerMove(event) {
  if (!dragging) {
    return;
  }

  const layer = layers[dragging.role];

  if (dragging.mode === "resize") {
    const delta = (event.clientX - dragging.startClientX) + (event.clientY - dragging.startClientY);
    const newSize = Math.max(12, Math.round(dragging.startSize + delta * 0.6));
    setFieldValue(layer.sizeInput, newSize);
    applyManualPosition(dragging.role);
    updateHud(dragging.role);
    return;
  }

  const previewX = Math.max(0, Math.min(event.clientX - dragging.bounds.left - dragging.offsetX, dragging.bounds.width));
  const previewY = Math.max(0, Math.min(event.clientY - dragging.bounds.top - dragging.offsetY, dragging.bounds.height));
  const x = Math.round((previewX / dragging.bounds.width) * 1080);
  const y = Math.round((previewY / dragging.bounds.height) * 1920);
  setFieldValue(layer.xInput, x);
  setFieldValue(layer.yInput, y);
  applyManualPosition(dragging.role);
  updateHud(dragging.role);
}

function stopDragging() {
  dragging = null;
  phoneScreen.classList.remove("is-dragging");
}

function nudgeActiveLayer(deltaX, deltaY) {
  const layer = layers[activeRole];
  const currentX = getNumericField(layer.xInput) ?? (layer.manualAnchor === "center" ? 540 : 60);
  const currentY = getNumericField(layer.yInput) ?? (layer.manualAnchor === "center" ? 960 : 80);
  setFieldValue(layer.xInput, Math.max(0, currentX + deltaX));
  setFieldValue(layer.yInput, Math.max(0, currentY + deltaY));
  applyManualPosition(activeRole);
  updateHud(activeRole);
}

form.addEventListener("input", updatePreview);
editorPanel.addEventListener("input", updatePreview);
editorPanel.addEventListener("focusin", (event) => {
  const role = event.target?.dataset?.roleControl;
  if (role) {
    setActiveRole(role);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Gerando video, isso pode levar alguns segundos...", "working");

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload())
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Falha ao gerar video.");
    }

    setStatus(`Video pronto: ${data.outputPath}`, "success");
    await loadOutputs();
  } catch (error) {
    setStatus(error.message, "error");
  }
});

outputsToggle.addEventListener("click", async () => {
  outputsExpanded = !outputsExpanded;
  await loadOutputs();
});

outputsPanel.addEventListener("toggle", async () => {
  await loadOutputs();
});

resetLayoutButton.addEventListener("click", () => {
  clearManualPositions();
});

clearManualConfigButton.addEventListener("click", () => {
  clearManualAdjustments();
});

applyBaseConfigButton.addEventListener("click", () => {
  applyBaseConfig();
});

openLatestVideoButton.addEventListener("click", async () => {
  try {
    await postJson("/api/open-latest-video");
    setStatus("Ultimo video aberto.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

openOutputFolderButton.addEventListener("click", async () => {
  try {
    await postJson("/api/open-output-folder");
    setStatus("Pasta de outputs aberta.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

sidebarToggle.addEventListener("click", () => {
  const collapsed = sidebarShell.classList.toggle("is-collapsed");
  sidebarToggle.textContent = collapsed ? "Abrir painel" : "Ocultar painel";
  sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
});

Object.entries(layers).forEach(([role, layer]) => {
  layer.node.dataset.role = role;
  layer.node.classList.add("draggable-layer");
  layer.node.addEventListener("pointerdown", (event) => startInteraction(role, event));
  layer.node.addEventListener("click", () => setActiveRole(role));
  layer.node.addEventListener("pointermove", (event) => updateResizeHotspot(role, event));
  layer.node.addEventListener("pointerleave", () => layer.node.classList.remove("is-resize-hover"));
});

window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", stopDragging);
window.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement?.tagName;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(activeTag)) {
    return;
  }

  const step = event.shiftKey ? 20 : 4;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    nudgeActiveLayer(-step, 0);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    nudgeActiveLayer(step, 0);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    nudgeActiveLayer(0, -step);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    nudgeActiveLayer(0, step);
  }
});

applyBaseConfig();
await loadTemplates();
await loadOutputs();
setActiveRole(activeRole);
updatePreview();
