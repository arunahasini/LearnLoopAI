export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url && !anonKey) {
    return null;
  }

  if (!url || !anonKey) {
    throw new Error(
      "Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }

  if (
    parsedUrl.protocol !== "https:" &&
    !(parsedUrl.protocol === "http:" && parsedUrl.hostname === "localhost")
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS (HTTP is allowed for localhost).",
    );
  }

  return { url: parsedUrl.origin, anonKey };
}

export function getAuthSiteUrl(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredUrl) {
    return process.env.NODE_ENV === "production"
      ? null
      : "http://localhost:3000";
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid URL.");
  }

  if (
    parsedUrl.protocol !== "https:" &&
    !(parsedUrl.protocol === "http:" && parsedUrl.hostname === "localhost")
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must use HTTPS (HTTP is allowed for localhost).",
    );
  }

  return parsedUrl.origin;
}
