import fs from "node:fs/promises";
import path from "node:path";
import { paths, videoDefaults } from "../config.js";
import { createTimestampName, ensureDir } from "../utils/fs.js";

function formatAssTime(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  const centiseconds = Math.floor((total - Math.floor(total)) * 100);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function normalizeColor(value, fallback = "white") {
  return String(value || fallback).trim().toLowerCase();
}

function parseColor(value, fallback = "white") {
  const normalized = normalizeColor(value, fallback);

  if (normalized === "white") {
    return { r: 255, g: 255, b: 255, alpha: 0 };
  }

  if (normalized === "black") {
    return { r: 0, g: 0, b: 0, alpha: 0 };
  }

  const alphaMatch = normalized.match(/(.+?)@([0-9.]+)$/);
  const rawColor = alphaMatch ? alphaMatch[1] : normalized;
  const opacity = alphaMatch ? Math.max(0, Math.min(1, Number(alphaMatch[2]) || 0)) : 1;

  if (rawColor.startsWith("0x") && rawColor.length === 8) {
    return {
      r: parseInt(rawColor.slice(2, 4), 16),
      g: parseInt(rawColor.slice(4, 6), 16),
      b: parseInt(rawColor.slice(6, 8), 16),
      alpha: Math.round((1 - opacity) * 255)
    };
  }

  if (rawColor.startsWith("#") && rawColor.length === 7) {
    return {
      r: parseInt(rawColor.slice(1, 3), 16),
      g: parseInt(rawColor.slice(3, 5), 16),
      b: parseInt(rawColor.slice(5, 7), 16),
      alpha: Math.round((1 - opacity) * 255)
    };
  }

  return parseColor(fallback, "white");
}

function toAssColor(value, fallback) {
  const color = parseColor(value, fallback);
  return `&H${color.alpha.toString(16).padStart(2, "0").toUpperCase()}${color.b
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()}${color.g.toString(16).padStart(2, "0").toUpperCase()}${color.r.toString(16).padStart(2, "0").toUpperCase()}`;
}

function assAlignment(anchor) {
  switch (anchor) {
    case "top-left":
      return 7;
    case "top-center":
      return 8;
    case "top-right":
      return 9;
    case "middle-left":
      return 4;
    case "middle-right":
      return 6;
    case "bottom-left":
      return 1;
    case "bottom-center":
      return 2;
    case "bottom-right":
      return 3;
    case "center":
    default:
      return 5;
  }
}

function resolveFromAnchor(anchor, marginX, marginY, width, height) {
  switch (anchor) {
    case "top-left":
      return { x: marginX, y: marginY, alignment: 7 };
    case "top-center":
      return { x: width / 2, y: marginY, alignment: 8 };
    case "top-right":
      return { x: width - marginX, y: marginY, alignment: 9 };
    case "middle-left":
      return { x: marginX, y: height / 2, alignment: 4 };
    case "middle-right":
      return { x: width - marginX, y: height / 2, alignment: 6 };
    case "bottom-left":
      return { x: marginX, y: height - marginY, alignment: 1 };
    case "bottom-center":
      return { x: width / 2, y: height - marginY, alignment: 2 };
    case "bottom-right":
      return { x: width - marginX, y: height - marginY, alignment: 3 };
    case "center":
    default:
      return { x: width / 2, y: height / 2, alignment: 5 };
  }
}

function parseManualCoordinate(value) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const direct = Number(value);
  if (!Number.isNaN(direct)) {
    return direct;
  }

  const centered = String(value || "").match(/^([0-9.]+)-\(text_[wh]\/2\)$/);
  if (centered) {
    return Number(centered[1]);
  }

  return null;
}

function escapeAssText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\r?\n/g, "\\N");
}

function fontNameFromEntry(entry) {
  if (!entry.font_file) {
    return "Arial";
  }

  return path.basename(entry.font_file, path.extname(entry.font_file));
}

function buildStyle(name, entry) {
  const borderStyle = entry.box ? 3 : 1;
  const outline = Number(entry.borderw || 0);
  const shadow = Math.max(Number(entry.shadow_y || 0), Number(entry.shadow_x || 0), 0);
  const backColor = entry.box ? toAssColor(entry.box_color, "black@0.35") : toAssColor(entry.shadow_color, "black@0.45");

  return [
    `Style: ${name}`,
    fontNameFromEntry(entry),
    Math.round(entry.font_size || 48),
    toAssColor(entry.font_color, videoDefaults.fontColor),
    toAssColor(entry.font_color, videoDefaults.fontColor),
    toAssColor(entry.bordercolor, "black@0.45"),
    backColor,
    "0",
    "0",
    "0",
    "0",
    "100",
    "100",
    "0",
    "0",
    borderStyle,
    outline,
    shadow,
    assAlignment(entry.anchor || "center"),
    "0",
    "0",
    "0",
    "1"
  ].join(",");
}

function buildDialogue(styleName, entry, duration, width, height) {
  const manualX = parseManualCoordinate(entry.x);
  const manualY = parseManualCoordinate(entry.y);
  const manualAnchor = entry.manual_anchor || (typeof entry.x === "string" && String(entry.x).includes("text_w/2") ? "center" : "top-left");
  const placement =
    manualX != null && manualY != null
      ? { x: manualX, y: manualY, alignment: assAlignment(manualAnchor) }
      : resolveFromAnchor(entry.anchor || "center", Number(entry.margin_x || 0), Number(entry.margin_y || 0), width, height);

  const tags = [`\\an${placement.alignment}`];
  const animation = entry.animation || {};
  const fadeInMs = Math.max(0, Number(animation.fade_in_ms || 0));
  const fadeOutMs = Math.max(0, Number(animation.fade_out_ms || 0));
  const distance = Math.max(0, Number(animation.distance || 42));
  const animationDuration = Math.max(0, Number(animation.duration_ms || 380));

  if (animation.type === "slide-up") {
    tags.push(`\\move(${Math.round(placement.x)},${Math.round(placement.y + distance)},${Math.round(placement.x)},${Math.round(placement.y)},0,${animationDuration})`);
  } else if (animation.type === "slide-left") {
    tags.push(`\\move(${Math.round(placement.x + distance)},${Math.round(placement.y)},${Math.round(placement.x)},${Math.round(placement.y)},0,${animationDuration})`);
  } else if (animation.type === "slide-right") {
    tags.push(`\\move(${Math.round(placement.x - distance)},${Math.round(placement.y)},${Math.round(placement.x)},${Math.round(placement.y)},0,${animationDuration})`);
  } else if (animation.type === "pop-in") {
    tags.push(`\\pos(${Math.round(placement.x)},${Math.round(placement.y)})`);
    tags.push("\\fscx85\\fscy85");
    tags.push(`\\t(0,${animationDuration},\\fscx100\\fscy100)`);
  } else {
    tags.push(`\\pos(${Math.round(placement.x)},${Math.round(placement.y)})`);
  }

  if (fadeInMs > 0 || fadeOutMs > 0) {
    tags.push(`\\fad(${fadeInMs},${fadeOutMs})`);
  }

  if (entry.text_align === "left") {
    tags.push("\\q2");
  } else if (entry.text_align === "right") {
    tags.push("\\q1");
  }

  return `Dialogue: 0,${formatAssTime(0)},${formatAssTime(duration)},${styleName},,0,0,0,,{${tags.join("")}}${escapeAssText(entry.content)}`;
}

export async function createAssSubtitleFile(config) {
  await ensureDir(paths.temp);

  const entries = [
    ...(config.texts || []),
    ...(config.watermark?.enabled && config.watermark.content
      ? [
          {
            ...config.watermark,
            role: "watermark",
            content: config.watermark.content
          }
        ]
      : [])
  ].filter((entry) => entry.content);

  const styles = [];
  const dialogues = [];

  entries.forEach((entry, index) => {
    const styleName = `Style${index + 1}`;
    styles.push(buildStyle(styleName, entry));
    dialogues.push(buildDialogue(styleName, entry, config.duration || videoDefaults.duration, config.width || videoDefaults.width, config.height || videoDefaults.height));
  });

  const script = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${config.width || videoDefaults.width}`,
    `PlayResY: ${config.height || videoDefaults.height}`,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding",
    ...styles,
    "",
    "[Events]",
    "Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text",
    ...dialogues,
    ""
  ].join("\n");

  const subtitlePath = path.join(paths.temp, `${createTimestampName("subtitles")}.ass`);
  await fs.writeFile(subtitlePath, script, "utf8");
  return subtitlePath;
}
