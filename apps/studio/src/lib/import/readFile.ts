/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FileReadProgress = {
  bytesRead: number;
  totalBytes: number;
};

export async function yieldToUi(): Promise<void> {
  await new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export async function readFileTextWithProgress(
  file: File,
  onProgress?: (progress: FileReadProgress) => void,
): Promise<string> {
  const totalBytes = file.size || 0;
  if (!file.stream || totalBytes <= 256 * 1024) {
    onProgress?.({ bytesRead: totalBytes, totalBytes });
    return file.text();
  }

  const reader = file.stream().getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  let lastYield = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      bytesRead += value.byteLength;
      onProgress?.({ bytesRead, totalBytes });
      if (bytesRead - lastYield > 512 * 1024) {
        lastYield = bytesRead;
        await yieldToUi();
      }
    }
  }

  const merged = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  onProgress?.({ bytesRead, totalBytes });
  return new TextDecoder("utf-8").decode(merged);
}

export async function readFileBufferWithProgress(
  file: File,
  onProgress?: (progress: FileReadProgress) => void,
): Promise<ArrayBuffer> {
  const totalBytes = file.size || 0;
  if (!file.stream || totalBytes <= 256 * 1024) {
    onProgress?.({ bytesRead: totalBytes, totalBytes });
    return file.arrayBuffer();
  }

  const reader = file.stream().getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  let lastYield = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      bytesRead += value.byteLength;
      onProgress?.({ bytesRead, totalBytes });
      if (bytesRead - lastYield > 512 * 1024) {
        lastYield = bytesRead;
        await yieldToUi();
      }
    }
  }

  const merged = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  onProgress?.({ bytesRead, totalBytes });
  return merged.buffer;
}
