import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { paths } from "./config.js";
import { generateFromConfig } from "./generator.js";
import { logger } from "./logger.js";
import { ensureDir } from "./utils/fs.js";

const publicDir = path.join(paths.root, "src", "web");
const MAX_BODY_BYTES = 1024 * 1024;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function bodyError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isInsideOrEqual(baseDir, targetPath) {
  const relative = path.relative(baseDir, targetPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isStrictlyInside(baseDir, targetPath) {
  const relative = path.relative(baseDir, targetPath);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function readBody(request) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;

    if (totalBytes > MAX_BODY_BYTES) {
      throw bodyError(413, "Corpo da requisicao excede o limite de 1MB.");
    }

    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw bodyError(400, "Corpo da requisicao nao e um JSON valido.");
  }
}

async function serveStatic(requestPath, response) {
  const cleanPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(publicDir, cleanPath);

  if (!isStrictlyInside(publicDir, filePath)) {
    sendJson(response, 403, { error: "Acesso negado." });
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".css"
          ? "text/css; charset=utf-8"
          : extension === ".js"
            ? "application/javascript; charset=utf-8"
            : "text/plain; charset=utf-8";

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "Arquivo nao encontrado." });
  }
}

async function listTemplates() {
  await ensureDir(paths.templates);
  const files = await fs.readdir(paths.templates);
  return files.filter((file) => file.endsWith(".json"));
}

async function listOutputs() {
  await ensureDir(paths.outputs);
  const files = await fs.readdir(paths.outputs);
  const entries = await Promise.all(
    files
      .filter((file) => file.endsWith(".mp4"))
      .map(async (file) => {
        const absolutePath = path.join(paths.outputs, file);
        const stats = await fs.stat(absolutePath);
        return {
          name: file,
          path: absolutePath,
          size: stats.size,
          createdAt: stats.birthtime.toISOString()
        };
      })
  );

  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function openPath(targetPath, mode = "file") {
  const resolved = path.resolve(targetPath);
  const outputsRoot = path.resolve(paths.outputs);

  if (!isInsideOrEqual(outputsRoot, resolved)) {
    throw new Error("Caminho fora da pasta de outputs.");
  }

  if (process.platform === "win32") {
    const args = mode === "folder" ? [resolved] : [`/select,${resolved}`];
    spawn("explorer.exe", args, { detached: true, stdio: "ignore" }).unref();
    return;
  }

  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(opener, [mode === "folder" ? path.dirname(resolved) : resolved], { detached: true, stdio: "ignore" }).unref();
}

export async function startServer(port = 3000) {
  await ensureDir(paths.outputs);
  await ensureDir(paths.templates);

  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    try {
      if (request.method === "GET" && requestUrl.pathname === "/api/templates") {
        sendJson(response, 200, { templates: await listTemplates() });
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/api/outputs") {
        sendJson(response, 200, { outputs: await listOutputs() });
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === "/api/generate") {
        const config = await readBody(request);
        const result = await generateFromConfig(config);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === "/api/open-latest-video") {
        const outputs = await listOutputs();
        if (outputs.length === 0) {
          throw new Error("Nenhum video gerado ainda.");
        }
        openPath(outputs[0].path, "file");
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === "/api/open-output-folder") {
        openPath(paths.outputs, "folder");
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.method === "GET") {
        await serveStatic(requestUrl.pathname, response);
        return;
      }

      sendJson(response, 404, { error: "Rota nao encontrada." });
    } catch (error) {
      logger.error("Falha na requisicao", { message: error.message });
      sendJson(response, error.statusCode || 500, { error: error.message });
    }
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      logger.info("Interface web disponivel", { url: `http://localhost:${port}` });
      resolve(server);
    });
  });
}