import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { z } from "zod";
import { DEMO_USER_ID } from "@/lib/auth/require-user";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: JSON_HEADERS });
}

export async function getApiUser() {
  try {
    if (!getSupabaseConfig()) {
      return {
        ok: true as const,
        user: {
          id: DEMO_USER_ID,
          email: null,
          user_metadata: { full_name: "Demo learner" },
          isDemo: true as const,
        },
      };
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        ok: false as const,
        response: apiError("Your session is not valid. Sign in and try again.", 401),
      };
    }
    return { ok: true as const, user: data.user };
  } catch {
    return {
      ok: false as const,
      response: apiError("Authentication is temporarily unavailable.", 503),
    };
  }
}

export async function readJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes = 48_000,
): Promise<{ value: T } | { response: Response }> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    return { response: apiError("Request is too large.", 413) };
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { response: apiError("Request body is required.", 400) };
  }
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel();
        return { response: apiError("Request is too large.", 413) };
      }
      chunks.push(value);
    }
  } catch {
    return { response: apiError("Could not read the request body.", 400) };
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let raw: string;
  try {
    raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { response: apiError("Request body must be valid UTF-8.", 400) };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { response: apiError("Request body must be valid JSON.", 400) };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { response: apiError("Request fields are invalid.", 400) };
  }
  return { value: result.data };
}

export function safeAIError(error: unknown, operation: string) {
  if (error instanceof Error) {
    console.error(`${operation} failed: ${error.name}`);
  }
  return apiError(
    "The AI service could not complete this request. Please retry in a moment.",
    502,
  );
}
