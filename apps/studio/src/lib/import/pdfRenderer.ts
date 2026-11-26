/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export interface RenderedSheetPages {
  imageBase64: string;
  imagesBase64: string[];
  mimeTypes: string[];
  pdfBase64: string;
  pageCount: number;
}

const MAX_PAGES = 5;
const RENDER_SCALE = 1.6;
const JPEG_QUALITY = 0.85;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export async function renderImageFile(file: File): Promise<{
  imageBase64: string;
  mimeType: string;
}> {
  const dataUrl = await fileToDataUrl(file);
  return { imageBase64: dataUrl, mimeType: file.type || "image/jpeg" };
}

/** Render pages 1..5 of a PDF to JPEG data URLs via an offscreen canvas. */
export async function renderPdfPages(file: File): Promise<RenderedSheetPages> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const pdfBase64 = await fileToDataUrl(file);
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;

  const pageCount = Math.min(doc.numPages, MAX_PAGES);
  const imagesBase64: string[] = [];
  const mimeTypes: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas 2D context unavailable for PDF rendering.");
      await page.render({ canvasContext: context, viewport }).promise;
      imagesBase64.push(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      mimeTypes.push("image/jpeg");
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await doc.destroy();
  }

  return {
    imageBase64: imagesBase64[0] ?? "",
    imagesBase64,
    mimeTypes,
    pdfBase64,
    pageCount,
  };
}
