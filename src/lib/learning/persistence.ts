import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { LearningAttempt } from "./types";

function createLearningWriteClient() {
  const config = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceRoleKey) {
    throw new Error(
      "Persistent grading requires server-side SUPABASE_SERVICE_ROLE_KEY configuration.",
    );
  }
  return createClient(config.url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function persistLearningAttempt(
  userId: string,
  attempt: LearningAttempt,
): Promise<void> {
  const supabase = createLearningWriteClient();
  const { error } = await supabase.from("learning_attempts").upsert(
    {
      id: attempt.id,
      user_id: userId,
      topic_id: attempt.topicId,
      question_id: attempt.questionId,
      selected_option: attempt.selectedOption,
      is_correct: attempt.isCorrect,
      attempted_at: attempt.attemptedAt,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) {
    console.error(`Learning attempt persistence failed: ${error.code}`);
    throw new Error(
      "Your answer was checked, but progress could not be saved. Apply the learning progress migration and retry.",
    );
  }
}
