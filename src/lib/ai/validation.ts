import type { z } from "zod";

export class ModelOutputError extends Error {
  constructor() {
    super("The AI provider returned content that did not match the required schema.");
    this.name = "ModelOutputError";
  }
}

export async function generateValidatedOutput<T>(
  request: () => Promise<string>,
  schema: z.ZodType<T>,
): Promise<T> {
  const raw = await request();
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    throw new ModelOutputError();
  }

  const result = schema.safeParse(decoded);
  if (!result.success) throw new ModelOutputError();
  return result.data;
}
