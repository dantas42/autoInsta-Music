import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { paths } from "./config.js";
import { generateFromConfig } from "./generator.js";
import { logger } from "./logger.js";
import { ensureDir } from "./utils/fs.js";

const publicDir = path.join(paths.root, "src", "web");

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(requestPath, response) {
  const cleanPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(publicDir, cleanPath);

  if (!filePath.startsWith(publicDir)) {
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

  if (!resolved.startsWith(path.resolve(paths.outputs))) {
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
      sendJson(response, 500, { error: error.message });
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      logger.info("Interface web disponivel", { url: `http://localhost:${port}` });
      resolve(server);
    });
  });
}
