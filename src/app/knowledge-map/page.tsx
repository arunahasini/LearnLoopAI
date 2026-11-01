import type { Metadata } from "next";
import { AppShell } from "@/components/learning/app-shell";
import { KnowledgeMapProgress } from "@/components/learning/knowledge-map-progress";
import { isDemoUser, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Knowledge map | LearnLoop AI",
};
export const instant = false;

export default async function KnowledgeMapPage() {
  const user = await requireUser();
  const userName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] || "Learner";

  return (
    <AppShell
      activePath="/knowledge-map"
      userName={userName}
      userId={user.id}
      demoMode={isDemoUser(user)}
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-indigo-700">
            SEE THE BIG PICTURE
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17213f] sm:text-4xl">
            Knowledge map
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Topic estimates are calculated from quiz attempts in this browser.
            No topic is assigned an arbitrary starting score.
          </p>
        </div>
      </div>
      <KnowledgeMapProgress />
    </AppShell>
  );
}
