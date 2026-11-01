import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

function isProtectedPath(pathname: string): boolean {
  return [
    "/dashboard",
    "/learn",
    "/quiz",
    "/knowledge-map",
    "/revision-planner",
    "/plans",
    "/materials",
    "/reset-password",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = isProtectedPath(pathname);
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (!isProtected && !isAuthPage) {
    return NextResponse.next({ request });
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    loginUrl.searchParams.set("setup", "missing");
    const response = NextResponse.redirect(loginUrl);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  }

  if (isAuthPage && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    const response = NextResponse.redirect(dashboardUrl);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/quiz/:path*",
    "/knowledge-map/:path*",
    "/revision-planner/:path*",
    "/plans/:path*",
    "/materials/:path*",
    "/login",
    "/signup",
    "/reset-password",
  ],
};
