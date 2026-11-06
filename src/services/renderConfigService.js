import path from "node:path";
import { textStylePresets, videoDefaults } from "../config.js";
import { loadTemplate } from "./templateService.js";

const visualPresetMap = {
  spotlight: {
    overlay_boxes: [
      { x: "0", y: "ih*0.58", w: "iw", h: "ih*0.42", color: "black@0.18" },
      { x: "0", y: "ih*0.74", w: "iw", h: "ih*0.26", color: "black@0.30" }
    ],
    title: {
      style_preset: "hero"
    },
    subtitle: {
      style_preset: "subtitle"
    },
    handle: {
      style_preset: "handle"
    },
    watermark: {
      style_preset: "watermark"
    }
  },
  "bold-card": {
    overlay_boxes: [
      { x: "0", y: "ih*0.56", w: "iw", h: "ih*0.44", color: "black@0.16" },
      { x: "0", y: "ih*0.74", w: "iw", h: "ih*0.26", color: "black@0.28" }
    ],
    title: {
      style_preset: "hero_card",
      font_size: 86,
      margin_y: 340
    },
    subtitle: {
      style_preset: "subtitle",
      font_size: 34,
      margin_y: 238,
      font_color: "white",
      shadow_color: "black@0.65"
    },
    handle: {
      style_preset: "handle"
    },
    watermark: {
      style_preset: "watermark",
      font_color: "white"
    }
  },
  "midnight-glass": {
    overlay_boxes: [
      { x: "0", y: "ih*0.52", w: "iw", h: "ih*0.48", color: "black@0.22" },
      { x: "0", y: "ih*0.72", w: "iw", h: "ih*0.28", color: "black@0.34" }
    ],
    title: {
      style_preset: "hero_glass",
      font_size: 80,
      margin_y: 340
    },
    subtitle: {
      style_preset: "subtitle",
      margin_y: 238,
      font_color: "0xE8EDF5",
      shadow_color: "black@0.6"
    },
    handle: {
      style_preset: "handle"
    },
    watermark: {
      style_preset: "watermark"
    }
  },
  "neon-pulse": {
    overlay_boxes: [
      { x: "0", y: "ih*0.58", w: "iw", h: "ih*0.42", color: "black@0.16" },
      { x: "0", y: "ih*0.76", w: "iw", h: "ih*0.24", color: "black@0.26" }
    ],
    title: {
      style_preset: "hero_neon",
      font_size: 88,
      margin_y: 338
    },
    subtitle: {
      style_preset: "subtitle",
      margin_y: 236,
      font_color: "0xFFD8C2",
      shadow_color: "0xFF7A33@0.55",
      shadow_x: 0,
      shadow_y: 4
    },
    handle: {
      style_preset: "handle"
    },
    watermark: {
      style_preset: "watermark",
      font_color: "0xFFE6D8"
    }
  },
  minimal: {
    overlay_boxes: [
      { x: "0", y: "ih*0.60", w: "iw", h: "ih*0.40", color: "black@0.22" }
    ],
    title: {
      style_preset: "hero",
      box: false,
      font_size: 78,
      margin_y: 330,
      shadow_color: "black@0.55",
      shadow_x: 0,
      shadow_y: 5
    },
    subtitle: {
      style_preset: "subtitle",
      margin_y: 230,
      font_size: 32
    },
    handle: {
      style_preset: "handle"
    },
    watermark: {
      style_preset: "watermark"
    }
  },
  editorial: {
    overlay_boxes: [
      { x: "0", y: "ih*0.55", w: "iw", h: "ih*0.45", color: "black@0.14" },
      { x: "0", y: "ih*0.78", w: "iw", h: "ih*0.22", color: "black@0.26" }
    ],
    title: {
      style_preset: "hero_editorial",
      font_size: 82,
      margin_y: 352
    },
    subtitle: {
      style_preset: "subtitle",
      font_size: 30,
      margin_y: 248,
      font_color: "0xE7E5E4"
    },
    handle: {
      style_preset: "handle"
    },
    watermark: {
      style_preset: "watermark"
    }
  },
  "lower-third": {
    overlay_boxes: [
      { x: "0", y: "ih*0.66", w: "iw", h: "ih*0.34", color: "black@0.18" }
    ],
    title: {
      style_preset: "hero_lower",
      font_size: 74,
      margin_x: 84,
      margin_y: 268
    },
    subtitle: {
      style_preset: "subtitle",
      anchor: "bottom-left",
      margin_x: 92,
      margin_y: 188,
      font_size: 28,
      font_color: "0xE5E7EB",
      text_align: "left"
    },
    handle: {
      style_preset: "handle"
    },
    watermark: {
      style_preset: "watermark"
    }
  },
  "lower-third-right": {
    overlay_boxes: [
      { x: "0", y: "ih*0.66", w: "iw", h: "ih*0.34", color: "black@0.18" }
    ],
    title: {
      style_preset: "hero_lower_right",
      font_size: 74,
      margin_x: 84,
      margin_y: 268,
      text_align: "right"
    },
    subtitle: {
      style_preset: "subtitle",
      anchor: "bottom-right",
      margin_x: 92,
      margin_y: 188,
      font_size: 28,
      font_color: "0xE5E7EB",
      text_align: "right"
    },
    handle: {
      style_preset: "handle"
    },
    watermark: {
      style_preset: "watermark"
    }
  },
  poster: {
    overlay_boxes: [
      { x: "0", y: "0", w: "iw", h: "ih", color: "black@0.08" },
      { x: "0", y: "ih*0.70", w: "iw", h: "ih*0.30", color: "black@0.18" }
    ],
    title: {
      style_preset: "hero_poster",
      font_size: 94,
      anchor: "center"
    },
    subtitle: {
      style_preset: "subtitle",
      anchor: "bottom-center",
      margin_y: 170,
      font_size: 30,
      font_color: "0xFDE68A",
      shadow_color: "black@0.48"
    },
    handle: {
      style_preset: "handle"
    },
    watermark: {
      style_preset: "watermark"
    }
  }
};

const genrePresetMap = {
  pop: {
    title: { font_color: "0xFFF7ED", shadow_color: "0xFB7185@0.32" },
    subtitle: { font_color: "0xFDE68A" }
  },
  lofi: {
    title: { font_color: "0xE5E7EB", shadow_color: "0x60A5FA@0.18" },
    subtitle: { font_color: "0xCBD5E1" }
  },
  phonk: {
    title: { font_color: "0xFFFFFF", bordercolor: "0x0F172A", shadow_color: "0xA855F7@0.34" },
    subtitle: { font_color: "0xE9D5FF" }
  },
  worship: {
    title: { font_color: "0xFEF3C7", shadow_color: "0xF59E0B@0.22" },
    subtitle: { font_color: "0xF8FAFC" }
  },
  trap: {
    title: { font_color: "0xF3F4F6", shadow_color: "0xEF4444@0.24" },
    subtitle: { font_color: "0xD1D5DB" }
  }
};

const sourceBadgeMap = {
  spotify: { content: "◉ Spotify", font_color: "0x1ED760", style_preset: "source_badge" },
  youtube: { content: "▶ YouTube", font_color: "0xFF3131", style_preset: "source_badge" },
  soundcloud: { content: "☁ SoundCloud", font_color: "0xFF7A00", style_preset: "source_badge" }
};

function roleByIndex(index) {
  if (index === 0) {
    return "title";
  }

  if (index === 1) {
    return "subtitle";
  }

  if (index === 2) {
    return "handle";
  }

  return "custom";
}

function normalizeTextRoles(texts) {
  if (!Array.isArray(texts)) {
    return [];
  }

  return texts.map((entry, index) => ({
    ...entry,
    role: entry.role || roleByIndex(index)
  }));
}

function applyVisualPresetToTexts(texts, presetName) {
  const preset = visualPresetMap[presetName];

  if (!preset) {
    return texts;
  }

  return texts.map((entry) => ({
    ...(preset[entry.role] || {}),
    ...entry
  }));
}

function applyGenrePresetToTexts(texts, genreName) {
  const preset = genrePresetMap[genreName];

  if (!preset) {
    return texts;
  }

  return texts.map((entry) => ({
    ...(preset[entry.role] || {}),
    ...entry
  }));
}

function mergeTextSlots(templateTexts, inputTexts) {
  const count = Math.max(templateTexts.length, inputTexts.length);
  const merged = [];

  for (let index = 0; index < count; index += 1) {
    const slot = templateTexts[index];
    const input = inputTexts[index];

    if (slot && input) {
      merged.push({
        ...slot,
        ...input,
        role: input.role || slot.role
      });
    } else if (input) {
      merged.push(input);
    } else if (slot) {
      merged.push(slot);
    }
  }

  return merged.filter((entry) => entry.content);
}

function validationError(field, message) {
  const error = new Error(message || `Campo "${field}" invalido.`);
  error.statusCode = 400;
  return error;
}

function validateRenderConfig(config) {
  if (!config.background) {
    throw validationError("background", "O campo background e obrigatorio.");
  }

  if (!config.audio_source) {
    throw validationError("audio_source", "O campo audio_source e obrigatorio.");
  }

  if (config.duration != null && config.duration !== "") {
    const duration = Number(config.duration);

    if (!Number.isFinite(duration) || duration <= 0) {
      throw validationError("duration", "O campo duration deve ser um numero maior que 0.");
    }
  }

  if (config.audio_start != null && config.audio_start !== "") {
    const audioStart = Number(config.audio_start);

    if (!Number.isFinite(audioStart) || audioStart < 0) {
      throw validationError("audio_start", "O campo audio_start deve ser um numero maior ou igual a 0.");
    }
  }
}

function applyTextDefaults(defaults = {}, entry = {}) {
  const preset = entry.style_preset ? textStylePresets[entry.style_preset] || {} : {};

  return {
    content: "",
    role: "custom",
    x: null,
    y: null,
    manual_anchor: null,
    anchor: "center",
    margin_x: 0,
    margin_y: 0,
    font_size: 48,
    font_color: videoDefaults.fontColor,
    font_file: videoDefaults.fontFile,
    box: false,
    box_color: "black@0.35",
    boxborderw: 20,
    shadow_color: null,
    shadow_x: 0,
    shadow_y: 0,
    borderw: 0,
    bordercolor: null,
    line_spacing: 8,
    text_align: "center",
    ...defaults,
    ...preset,
    ...entry,
    font_file: entry.font_file || preset.font_file || defaults.font_file || videoDefaults.fontFile
  };
}

function applyWatermarkDefaults(defaults = {}, value = {}) {
  const preset = value.style_preset ? textStylePresets[value.style_preset] || {} : textStylePresets.watermark || {};

  return {
    enabled: false,
    content: "",
    position: "bottom-right",
    manual_anchor: null,
    anchor: null,
    margin: 40,
    margin_x: 40,
    margin_y: 40,
    font_size: 24,
    font_color: "white",
    font_file: videoDefaults.fontFile,
    shadow_color: "black@0.45",
    shadow_x: 0,
    shadow_y: 3,
    ...defaults,
    ...preset,
    ...value,
    font_file: value.font_file || preset.font_file || defaults.font_file || videoDefaults.fontFile
  };
}

function appendSourceBadge(config) {
  const badge = sourceBadgeMap[config.source_platform];

  if (!badge) {
    return config;
  }

  return {
    ...config,
    texts: [
      ...(config.texts || []),
      {
        role: "source_badge",
        ...badge
      }
    ]
  };
}

export async function buildRenderConfig(config, options = {}) {
  validateRenderConfig(config);

  const template = await loadTemplate(config.template);
  const templateDefaults = template.defaults || {};
  const visualName = config.visual_preset;
  const genreName = config.genre_preset;
  const visualPreset = visualPresetMap[visualName];

  const templateTexts = normalizeTextRoles(template.texts);
  const inputTexts = normalizeTextRoles(config.texts);

  const processedInputTexts = applyGenrePresetToTexts(applyVisualPresetToTexts(inputTexts, visualName), genreName);
  const processedTemplateTexts = applyGenrePresetToTexts(applyVisualPresetToTexts(templateTexts, visualName), genreName);
  const mergedTexts = mergeTextSlots(processedTemplateTexts, processedInputTexts);

  const base = {
    ...templateDefaults,
    ...template,
    ...config,
    overlay_boxes: config.overlay_boxes || visualPreset?.overlay_boxes || [],
    texts: mergedTexts,
    watermark: {
      ...(visualPreset?.watermark || {}),
      ...(template.watermark || {}),
      ...(config.watermark || {})
    },
    resolvedInputPath: config.resolvedInputPath || options.resolvedInputPath
  };

  const withSourceBadge = appendSourceBadge(base);

  return {
    ...withSourceBadge,
    width: withSourceBadge.width || videoDefaults.width,
    height: withSourceBadge.height || videoDefaults.height,
    fps: withSourceBadge.fps || videoDefaults.fps,
    duration: withSourceBadge.duration || videoDefaults.duration,
    audio_start: withSourceBadge.audio_start || 0,
    texts: (withSourceBadge.texts || []).map((entry) => applyTextDefaults(templateDefaults.text, entry)),
    watermark: applyWatermarkDefaults(templateDefaults.watermark, withSourceBadge.watermark || {})
  };
}

export function inferOutputName(config) {
  const texts = config.texts || [];
  const fallbackText = texts.find((entry) => entry.role === "title")?.content || texts.find((entry) => entry.content)?.content;

  return (
    config.output_name ||
    config.slug ||
    fallbackText ||
    path.basename(config.resolvedInputPath || "reel", path.extname(config.resolvedInputPath || ""))
  );
}

export function buildCoverRenderConfig(config) {
  const cover = config.cover || {};
  const titleEntry = (config.texts || []).find((entry) => entry.role === "title");
  const subtitleEntry = (config.texts || []).find((entry) => entry.role === "subtitle");
  const badgeEntry = (config.texts || []).find((entry) => entry.role === "source_badge");

  return {
    ...config,
    duration: 1,
    texts: [
      titleEntry
        ? {
            ...titleEntry,
            content: cover.title || titleEntry.content,
            animation: null
          }
        : null,
      subtitleEntry
        ? {
            ...subtitleEntry,
            content: cover.subtitle || subtitleEntry.content,
            animation: null
          }
        : null,
      badgeEntry
        ? {
            ...badgeEntry,
            animation: null
          }
        : null
    ].filter(Boolean),
    watermark: {
      enabled: false
    }
  };
}