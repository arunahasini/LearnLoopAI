import { NextRequest, NextResponse } from "next/server";
import { isNetworkError, safeInternalPath } from "@/lib/auth/validation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedPath = safeInternalPath(
    request.nextUrl.searchParams.get("next") ?? "/dashboard",
  );
  const nextPath =
    requestedPath === "/reset-password" ? requestedPath : "/dashboard";

  if (!getSupabaseConfig()) {
    return NextResponse.redirect(new URL("/login?setup=missing", request.url));
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=callback", request.url),
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          isNetworkError(error)
            ? "/login?error=network"
            : "/login?error=callback",
          request.url,
        ),
      );
    }
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        isNetworkError(error)
          ? "/login?error=network"
          : "/login?error=callback",
        request.url,
      ),
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
