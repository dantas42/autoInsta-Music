import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export async function downloadFile(url, destinationPath) {
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar asset: ${url} (${response.status})`);
  }

  const writeStream = fs.createWriteStream(destinationPath);
  await pipeline(Readable.fromWeb(response.body), writeStream);
  return destinationPath;
}
