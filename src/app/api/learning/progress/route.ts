import { apiError, getApiUser } from "@/lib/ai/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LearningAttempt } from "@/lib/learning/types";
import { isDemoUserId } from "@/lib/auth/require-user";

export async function GET() {
  const auth = await getApiUser();
  if (!auth.ok) return auth.response;
  if (isDemoUserId(auth.user.id)) {
    return Response.json({ mode: "demo", attempts: [] });
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("learning_attempts")
      .select("id, question_id, topic_id, selected_option, is_correct, attempted_at")
      .eq("user_id", auth.user.id)
      .order("attempted_at", { ascending: true });
    if (error) {
      console.error(`Learning progress load failed: ${error.code}`);
      return apiError(
        "Saved progress is unavailable. Apply the learning progress migration and retry.",
        503,
      );
    }
    const attempts: LearningAttempt[] = data.map((row) => ({
      id: row.id,
      questionId: row.question_id,
      topicId: row.topic_id as LearningAttempt["topicId"],
      selectedOption: row.selected_option,
      isCorrect: row.is_correct,
      attemptedAt: row.attempted_at,
    }));
    return Response.json(
      { mode: "supabase", attempts },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return apiError("Saved progress could not be loaded.", 503);
  }
}

export async function DELETE() {
  const auth = await getApiUser();
  if (!auth.ok) return auth.response;
  if (isDemoUserId(auth.user.id)) return Response.json({ mode: "demo" });

  try {
    const supabase = await createSupabaseServerClient();
    const attempts = await supabase
      .from("learning_attempts")
      .delete()
      .eq("user_id", auth.user.id);
    if (attempts.error) throw attempts.error;

    const tasks = await supabase
      .from("revision_tasks")
      .delete()
      .eq("user_id", auth.user.id);
    if (tasks.error) throw tasks.error;

    return Response.json({ mode: "supabase" });
  } catch (error) {
    if (error instanceof Error) console.error(`Learning reset failed: ${error.name}`);
    return apiError("Saved learning progress could not be reset.", 503);
  }
}
