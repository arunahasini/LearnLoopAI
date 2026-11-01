import { z } from "zod";
import { apiError, getApiUser, readJsonBody } from "@/lib/ai/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { courseTopics } from "@/lib/learning/types";
import { isDemoUserId } from "@/lib/auth/require-user";

const topicIds = courseTopics.map((topic) => topic.id) as [
  (typeof courseTopics)[number]["id"],
  ...(typeof courseTopics)[number]["id"][],
];
const tasksSchema = z
  .object({
    tasks: z
      .array(
        z
          .object({
            taskId: z.string().min(1).max(120),
            topicId: z.enum(topicIds),
            title: z.string().min(1).max(180),
            rationale: z.string().max(500),
            priority: z.enum(["high", "medium", "review"]),
            completed: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(30),
  })
  .strict();

export async function GET() {
  const auth = await getApiUser();
  if (!auth.ok) return auth.response;
  if (isDemoUserId(auth.user.id)) return Response.json({ mode: "demo", tasks: [] });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("revision_tasks")
      .select("task_id, topic_id, title, rationale, priority, completed")
      .eq("user_id", auth.user.id);
    if (error) {
      console.error(`Revision task load failed: ${error.code}`);
      return apiError("Saved revision tasks are unavailable. Apply the learning progress migration.", 503);
    }
    return Response.json(
      {
        mode: "supabase",
        tasks: data.map((row) => ({
          taskId: row.task_id,
          topicId: row.topic_id,
          title: row.title,
          rationale: row.rationale,
          priority: row.priority,
          completed: row.completed,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return apiError("Saved revision tasks could not be loaded.", 503);
  }
}

export async function PUT(request: Request) {
  const auth = await getApiUser();
  if (!auth.ok) return auth.response;
  if (isDemoUserId(auth.user.id)) {
    return apiError("Demo tasks are saved in this browser, not on the server.", 409);
  }
  const body = await readJsonBody(request, tasksSchema, 24_000);
  if ("response" in body) return body.response;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("revision_tasks").upsert(
      body.value.tasks.map((task) => ({
        task_id: task.taskId,
        user_id: auth.user.id,
        topic_id: task.topicId,
        title: task.title,
        rationale: task.rationale,
        priority: task.priority,
        completed: task.completed,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,task_id" },
    );
    if (error) {
      console.error(`Revision task save failed: ${error.code}`);
      return apiError("Revision task progress could not be saved.", 503);
    }
    return Response.json({ saved: body.value.tasks.length });
  } catch {
    return apiError("Revision task progress could not be saved.", 503);
  }
}
