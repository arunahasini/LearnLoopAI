import { apiError, getApiUser } from "@/lib/ai/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  extractStudyMaterial,
  MaterialExtractionError,
  MAX_UPLOAD_BYTES,
} from "@/lib/materials/extract";
import { courseTopics } from "@/lib/learning/types";
import { isDemoUserId } from "@/lib/auth/require-user";

export async function POST(request: Request) {
  const auth = await getApiUser();
  if (!auth.ok) return auth.response;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const maxRequestBytes = MAX_UPLOAD_BYTES + 64_000;
  if (contentLength > maxRequestBytes) {
    return apiError("Upload a file no larger than 10 MB.", 413);
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    return apiError("Upload must use a multipart PDF or TXT form.", 400);
  }
  const reader = request.body?.getReader();
  if (!reader) return apiError("Upload body is required.", 400);
  const chunks: Uint8Array[] = [];
  let bodyLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bodyLength += value.byteLength;
      if (bodyLength > maxRequestBytes) {
        await reader.cancel();
        return apiError("Upload request exceeds the 10 MB file limit.", 413);
      }
      chunks.push(value);
    }
  } catch {
    return apiError("Could not read the upload. Please retry the file.", 400);
  }
  const bodyBytes = new Uint8Array(bodyLength);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let form: FormData;
  try {
    form = await new Response(bodyBytes, {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch {
    return apiError("Could not read the upload. Please retry the file.", 400);
  }
  const file = form.get("file");
  const topicId = form.get("topicId");
  if (
    !(file instanceof File) ||
    typeof topicId !== "string" ||
    !courseTopics.some((topic) => topic.id === topicId)
  ) {
    return apiError("Choose a valid topic and a PDF or TXT file.", 400);
  }
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return apiError("Files must be between 1 byte and 10 MB.", 413);
  }
  if (file.name.length > 255) {
    return apiError("The file name is too long.", 400);
  }
  const safeName = file.name.replace(/[\\/]/g, "_").slice(0, 255);

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await extractStudyMaterial(
      safeName,
      file.type,
      bytes,
    );
    if (!isDemoUserId(auth.user.id)) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.from("uploaded_study_materials").insert({
        user_id: auth.user.id,
        topic_id: topicId,
        file_name: safeName,
        media_type: file.type,
        file_size_bytes: file.size,
        extracted_characters: result.text.length,
      });
      if (error) {
        console.error(`Study material metadata save failed: ${error.code}`);
        return apiError(
          "Text was extracted, but its metadata could not be saved. Apply the learning progress migration and retry.",
          503,
        );
      }
    }
    return Response.json(
      {
        fileName: safeName,
        topicId,
        text: result.text,
        characterCount: result.text.length,
        pages: result.pages,
        storage: isDemoUserId(auth.user.id) ? "local-demo" : "metadata-only",
        notice:
          "Extracted text is held temporarily in this page and is not stored as an uploaded file. Treat document contents as untrusted reference material.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof MaterialExtractionError) {
      return apiError(error.message, 422);
    }
    if (error instanceof Error) console.error(`Study material extraction failed: ${error.name}`);
    return apiError("Text extraction failed. Retry the upload or choose another file.", 422);
  }
}
