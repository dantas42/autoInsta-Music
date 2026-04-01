import path from "node:path";

const rootDir = process.cwd();
const windowsFontPath = process.platform === "win32" ? path.join(process.env.WINDIR || "C:\\Windows", "Fonts", "arial.ttf") : null;

export const paths = {
  root: rootDir,
  inputs: path.join(rootDir, "inputs"),
  outputs: path.join(rootDir, "outputs"),
  assets: path.join(rootDir, "assets"),
  temp: path.join(rootDir, "assets", "tmp"),
  templates: path.join(rootDir, "templates")
};

export const videoDefaults = {
  width: 1080,
  height: 1920,
  fps: 30,
  duration: 20,
  outputExtension: "mp4",
  fontColor: "white",
  fontFile: process.env.DEFAULT_FONT_FILE || windowsFontPath,
  backgroundVolume: 0
};

export const textStylePresets = {
  hero: {
    anchor: "bottom-center",
    margin_y: 360,
    font_size: 72,
    font_color: "white",
    box: true,
    box_color: "black@0.38",
    boxborderw: 28,
    shadow_color: "black@0.5",
    shadow_x: 0,
    shadow_y: 4
  },
  hero_card: {
    anchor: "bottom-center",
    margin_y: 340,
    font_size: 80,
    font_color: "white",
    box: true,
    box_color: "0xFF8A3D@0.96",
    boxborderw: 34,
    borderw: 4,
    bordercolor: "0x1F1008",
    shadow_color: "black@0.4",
    shadow_x: 0,
    shadow_y: 5,
    line_spacing: 10
  },
  hero_glass: {
    anchor: "bottom-center",
    margin_y: 340,
    font_size: 76,
    font_color: "white",
    box: true,
    box_color: "0x0B1621@0.56",
    boxborderw: 30,
    borderw: 2,
    bordercolor: "0xFFFFFF@0.18",
    shadow_color: "black@0.45",
    shadow_x: 0,
    shadow_y: 4
  },
  hero_neon: {
    anchor: "bottom-center",
    margin_y: 340,
    font_size: 82,
    font_color: "white",
    box: false,
    borderw: 5,
    bordercolor: "0x1E0E0A",
    shadow_color: "0xFF7A33@0.45",
    shadow_x: 0,
    shadow_y: 6
  },
  hero_editorial: {
    anchor: "bottom-center",
    margin_y: 352,
    font_size: 78,
    font_color: "0xF5F5F4",
    box: false,
    borderw: 3,
    bordercolor: "0x111827",
    shadow_color: "black@0.42",
    shadow_x: 0,
    shadow_y: 5
  },
  hero_lower: {
    anchor: "bottom-left",
    margin_x: 84,
    margin_y: 272,
    font_size: 72,
    font_color: "white",
    box: true,
    box_color: "0x09090B@0.92",
    boxborderw: 24,
    borderw: 2,
    bordercolor: "0xFFFFFF@0.12",
    text_align: "left",
    shadow_color: "black@0.35",
    shadow_x: 0,
    shadow_y: 4
  },
  hero_lower_right: {
    anchor: "bottom-right",
    margin_x: 84,
    margin_y: 272,
    font_size: 72,
    font_color: "white",
    box: true,
    box_color: "0x09090B@0.92",
    boxborderw: 24,
    borderw: 2,
    bordercolor: "0xFFFFFF@0.12",
    text_align: "right",
    shadow_color: "black@0.35",
    shadow_x: 0,
    shadow_y: 4
  },
  hero_poster: {
    anchor: "center",
    margin_y: 0,
    font_size: 90,
    font_color: "0xFFF7ED",
    box: false,
    borderw: 4,
    bordercolor: "0x0F172A",
    shadow_color: "0x7C3AED@0.30",
    shadow_x: 0,
    shadow_y: 8
  },
  subtitle: {
    anchor: "bottom-center",
    margin_y: 260,
    font_size: 34,
    font_color: "white",
    shadow_color: "black@0.45",
    shadow_x: 0,
    shadow_y: 3
  },
  handle: {
    anchor: "top-left",
    margin_x: 60,
    margin_y: 80,
    font_size: 28,
    font_color: "white",
    shadow_color: "black@0.45",
    shadow_x: 0,
    shadow_y: 3
  },
  watermark: {
    anchor: "bottom-right",
    margin_x: 48,
    margin_y: 48,
    font_size: 24,
    font_color: "white",
    shadow_color: "black@0.45",
    shadow_x: 0,
    shadow_y: 3
  },
  source_badge: {
    anchor: "top-right",
    margin_x: 52,
    margin_y: 82,
    font_size: 24,
    font_color: "white",
    box: true,
    box_color: "black@0.48",
    boxborderw: 16,
    shadow_color: "black@0.3",
    shadow_x: 0,
    shadow_y: 2
  }
};

export const binaryNames = {
  ffmpeg: process.env.FFMPEG_PATH || "ffmpeg",
  ffprobe: process.env.FFPROBE_PATH || "ffprobe",
  ytDlp: process.env.YT_DLP_PATH || "yt-dlp"
};
