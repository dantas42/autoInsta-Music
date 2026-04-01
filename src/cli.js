#!/usr/bin/env node
import { binaryNames } from "./config.js";
import { generateFromFile } from "./generator.js";
import { logger } from "./logger.js";
import { runBatch } from "./services/batchService.js";
import { runCommand } from "./utils/process.js";
import { startServer } from "./server.js";

function printHelp() {
  console.log(`
Uso:
  node src/cli.js generate <input.json>
  node src/cli.js batch <batch.json>
  node src/cli.js doctor
  node src/cli.js web [porta]

Exemplos:
  node src/cli.js generate sample-input.json
  node src/cli.js batch batch-example.json
  node src/cli.js web 3000
`);
}

async function runDoctor() {
  const commands = [
    { label: "ffmpeg", command: binaryNames.ffmpeg, args: ["-version"] },
    { label: "yt-dlp", command: binaryNames.ytDlp, args: ["--version"] }
  ];

  for (const item of commands) {
    try {
      const result = await runCommand(item.command, item.args);
      const firstLine = (result.stdout || result.stderr).split(/\r?\n/).find(Boolean);
      logger.info(`Dependencia OK: ${item.label}`, { version: firstLine });
    } catch (error) {
      logger.error(`Dependencia indisponivel: ${item.label}`, { message: error.message });
      process.exitCode = 1;
    }
  }
}

async function main() {
  const [, , command, target] = process.argv;

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  try {
    if (command === "generate") {
      if (!target) {
        throw new Error("Informe o arquivo JSON de entrada.");
      }

      const result = await generateFromFile(target);
      logger.info("Arquivo final pronto", result);
      return;
    }

    if (command === "batch") {
      if (!target) {
        throw new Error("Informe o arquivo JSON de batch.");
      }

      const results = await runBatch(target);
      logger.info("Lote concluido", { total: results.length });
      return;
    }

    if (command === "doctor") {
      await runDoctor();
      return;
    }

    if (command === "web") {
      const port = Number(target || 3000);
      await startServer(port);
      return;
    }

    throw new Error(`Comando desconhecido: ${command}`);
  } catch (error) {
    logger.error(error.message);
    process.exitCode = 1;
  }
}

await main();
