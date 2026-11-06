import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export async function downloadFile(url, destinationPath, timeoutMs = 60_000) {
  let response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new Error(`Tempo esgotado ao baixar asset: ${url}`);
    }

    throw error;
  }

  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar asset: ${url} (${response.status})`);
  }

  const writeStream = fs.createWriteStream(destinationPath);

  try {
    await pipeline(Readable.fromWeb(response.body), writeStream);
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new Error(`Tempo esgotado ao baixar asset: ${url}`);
    }

    throw error;
  }

  return destinationPath;
}