import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  extractStudyMaterial,
  MaterialExtractionError,
} from "./extract";

function makeSinglePagePdf(text: string): Uint8Array {
  const content = `BT /F1 12 Tf 72 720 Td (${text.replace(/[()\\]/g, "\\$&")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Uint8Array(Buffer.from(pdf, "utf8"));
}

describe("study-material extraction", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts UTF-8 text within the content limit", async () => {
    const bytes = new TextEncoder().encode("Arrays use indexes to access elements.");
    const result = await extractStudyMaterial("notes.txt", "text/plain", bytes);
    expect(result.text).toContain("Arrays use indexes");
    expect(result.pages).toBeNull();
  });

  it("extracts text from a PDF sample", async () => {
    const bytes = makeSinglePagePdf(
      "LearnLoop sample: arrays use zero-based indexing.",
    );
    const result = await extractStudyMaterial(
      "sample.pdf",
      "application/pdf",
      bytes,
    );
    expect(result.text.toLowerCase()).toContain("zero-based indexing");
    expect(result.pages).toBe(1);
  });

  it("rejects oversized, invalid-encoding, and signature-mismatched files", async () => {
    await expect(
      extractStudyMaterial(
        "notes.txt",
        "text/plain",
        new Uint8Array(10 * 1024 * 1024 + 1),
      ),
    ).rejects.toBeInstanceOf(MaterialExtractionError);
    await expect(
      extractStudyMaterial("notes.txt", "text/plain", new Uint8Array([0xff])),
    ).rejects.toThrow("not valid UTF-8");
    await expect(
      extractStudyMaterial(
        "notes.pdf",
        "application/pdf",
        new TextEncoder().encode("not pdf"),
      ),
    ).rejects.toThrow("valid PDF signature");
  });

  it("rejects unsupported types and text beyond the extraction limit", async () => {
    await expect(
      extractStudyMaterial(
        "notes.docx",
        "application/octet-stream",
        new Uint8Array([1]),
      ),
    ).rejects.toThrow("Upload a PDF or UTF-8 TXT file");
    await expect(
      extractStudyMaterial(
        "notes.txt",
        "text/plain",
        new TextEncoder().encode("a".repeat(12_001)),
      ),
    ).rejects.toThrow("extracted content exceeds");
  });
});
