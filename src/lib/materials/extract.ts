import "server-only";

import { PDFParse } from "pdf-parse";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_EXTRACTED_CHARACTERS = 12_000;
export const MAX_PDF_PAGES = 40;

export class MaterialExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaterialExtractionError";
  }
}

export async function extractStudyMaterial(
  fileName: string,
  mediaType: string,
  bytes: Uint8Array,
): Promise<{ text: string; pages: number | null }> {
  if (bytes.byteLength === 0) {
    throw new MaterialExtractionError("The uploaded file is empty.");
  }
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new MaterialExtractionError("Files must be 10 MB or smaller.");
  }

  let text: string;
  let pages: number | null = null;
  if (fileName.toLowerCase().endsWith(".txt") && mediaType === "text/plain") {
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new MaterialExtractionError(
        "This text file is not valid UTF-8. Save it as UTF-8 and try again.",
      );
    }
    if (text.includes("\u0000")) {
      throw new MaterialExtractionError(
        "This file contains binary data and is not a plain text document.",
      );
    }
  } else if (
    fileName.toLowerCase().endsWith(".pdf") &&
    mediaType === "application/pdf"
  ) {
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
      throw new MaterialExtractionError(
        "The file does not have a valid PDF signature.",
      );
    }
    const parser = new PDFParse({
      data: bytes,
      isEvalSupported: false,
      stopAtErrors: true,
      verbosity: 0,
    });
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        parser.getText({ first: MAX_PDF_PAGES }),
        new Promise<never>((_, reject) =>
          (timeout = setTimeout(
            () =>
              reject(
                new MaterialExtractionError(
                  "PDF extraction timed out. Try a smaller document.",
                ),
              ),
            15_000,
          )),
        ),
      ]);
      pages = result.total;
      if (result.total > MAX_PDF_PAGES) {
        throw new MaterialExtractionError(
          `This PDF has ${result.total} pages. Upload a document with ${MAX_PDF_PAGES} pages or fewer.`,
        );
      }
      text = result.text;
    } catch (error) {
      if (error instanceof MaterialExtractionError) throw error;
      throw new MaterialExtractionError(
        "We could not read this PDF. It may be damaged, encrypted, or image-only. Try another PDF or a text file.",
      );
    } finally {
      if (timeout) clearTimeout(timeout);
      await parser.destroy();
    }
  } else {
    throw new MaterialExtractionError("Upload a PDF or UTF-8 TXT file.");
  }

  text = text.replace(/\r\n?/g, "\n").trim();
  if (!text) {
    throw new MaterialExtractionError(
      "No selectable text was found. Image-only scanned PDFs are not supported yet.",
    );
  }
  if (text.length > MAX_EXTRACTED_CHARACTERS) {
    throw new MaterialExtractionError(
      `The extracted content exceeds ${MAX_EXTRACTED_CHARACTERS.toLocaleString()} characters. Shorten the document and retry.`,
    );
  }
  return { text, pages };
}
