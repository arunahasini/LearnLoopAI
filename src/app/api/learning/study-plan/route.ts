import { apiError, getApiUser, readJsonBody, safeAIError } from "@/lib/ai/http";
import { studyPlanRequestSchema, studyPlanSchema } from "@/lib/ai/schemas";
import { getAIClient, requestValidatedOutput } from "@/lib/ai/server";
import { isDemoUserId } from "@/lib/auth/require-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await getApiUser();
  if (!auth.ok) return auth.response;
  const body = await readJsonBody(request, studyPlanRequestSchema, 16_000);
  if ("response" in body) return body.response;
  if (!getAIClient()) {
    return apiError(
      "AI study plans are unavailable because no provider API key is configured. Your evidence-based revision list is still available.",
      503,
    );
  }
  const input = body.value;

  try {
    const plan = await requestValidatedOutput(
      [
        "Create a prioritized revision plan for a learner using only the supplied mastery evidence.",
        `Available study time: ${input.availableStudyMinutes} minutes.`,
        `Deadline: ${input.deadline ?? "not specified"}.`,
        `Mastery evidence (do not invent or alter these values): ${JSON.stringify(input.masteryEvidence)}`,
        "Return JSON with tasks. Each task must include topicId, title, rationale, priority (high, medium, or review), and durationMinutes. Prioritize low or insufficient-evidence topics; include review for well-mastered topics only after weaker areas. Include no more than one task per topic.",
      ].join("\n"),
      studyPlanSchema,
    );
    if (
      plan.tasks.reduce((total, task) => total + task.durationMinutes, 0) >
      input.availableStudyMinutes
    ) {
      return apiError(
        "The AI plan exceeded the time you have available. Please retry.",
        502,
      );
    }
    const tasks = plan.tasks.map((task) => ({
      ...task,
      taskId: `plan-${crypto.randomUUID()}`,
      rationale: task.rationale,
      completed: false,
    }));
    if (!isDemoUserId(auth.user.id)) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.from("revision_tasks").upsert(
        tasks.map((task) => ({
          task_id: task.taskId,
          user_id: auth.user.id,
          topic_id: task.topicId,
          title: task.title,
          rationale: task.rationale,
          priority: task.priority,
          completed: false,
        })),
        { onConflict: "user_id,task_id" },
      );
      if (error) {
        console.error(`AI plan persistence failed: ${error.code}`);
        return apiError("The plan was generated but could not be saved.", 503);
      }
    }
    return Response.json(
      {
        tasks,
        notice:
          "Model-generated revision suggestions based on your current demo evidence; these are not verified pedagogical recommendations.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return safeAIError(error, "AI study plan");
  }
}
