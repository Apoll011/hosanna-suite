/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const ZIP_LOCAL_FILE_HEADER = 0x04034b50;

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress SongbookPro backup archives.");
  }
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const stream = new Blob([copy.buffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function readAscii(view: DataView, offset: number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += String.fromCharCode(view.getUint8(offset + i));
  }
  return out;
}

export async function extractZipTextFile(
  buffer: ArrayBuffer,
  preferredNames: readonly string[],
): Promise<string | null> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const preferred = preferredNames.map((n) => n.toLowerCase());
  let offset = 0;
  let fallback: string | null = null;

  while (offset + 30 <= bytes.length) {
    const signature = view.getUint32(offset, true);
    if (signature !== ZIP_LOCAL_FILE_HEADER) break;

    const compression = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const name = readAscii(view, nameStart, nameLength);
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) break;

    const payload = bytes.subarray(dataStart, dataEnd);
    let inflated: Uint8Array;
    if (compression === 0) {
      inflated = payload;
    } else if (compression === 8) {
      inflated = await inflateRaw(payload);
    } else {
      offset = dataEnd;
      continue;
    }

    const text = new TextDecoder("utf-8").decode(inflated);
    const baseName = name.split("/").pop()?.toLowerCase() ?? name.toLowerCase();
    if (preferred.includes(baseName)) {
      return text;
    }
    if (!fallback && baseName.endsWith(".txt")) {
      fallback = text;
    }

    offset = dataEnd;
  }

  return fallback;
}

export function isZipBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const view = new DataView(buffer);
  return view.getUint32(0, true) === ZIP_LOCAL_FILE_HEADER;
}
