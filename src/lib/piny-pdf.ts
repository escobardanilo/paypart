import "server-only";

import { extractText, getDocumentProxy } from "unpdf";

const MAX_PDF_PAGES = 40;
const MAX_EXTRACTED_CHARACTERS = 12_000;
const PDF_TIMEOUT_MS = 8_000;

export class PinyPdfError extends Error {
  constructor(public readonly kind: "unreadable" | "no_text") {
    super(kind);
  }
}

function withTimeout<T>(promise: Promise<T>) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new PinyPdfError("unreadable")), PDF_TIMEOUT_MS);
    }),
  ]);
}

export async function extractPinyPdfText(file: File) {
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const document = await withTimeout(getDocumentProxy(data, {
      maxImageSize: 16_777_216,
    }));

    if (document.numPages > MAX_PDF_PAGES) {
      throw new PinyPdfError("unreadable");
    }

    const result = await withTimeout(extractText(document, { mergePages: true }));
    const text = result.text.replace(/\0/g, "").replace(/[ \t]+/g, " ").trim();

    if (text.replace(/\s/g, "").length < 20) {
      throw new PinyPdfError("no_text");
    }

    return text.slice(0, MAX_EXTRACTED_CHARACTERS);
  } catch (error) {
    if (error instanceof PinyPdfError) throw error;
    throw new PinyPdfError("unreadable");
  }
}
