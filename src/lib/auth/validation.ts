export type AuthActionState = {
  error?: string;
  success?: string;
};

export const initialAuthActionState: AuthActionState = {};

export function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 72;
}

export function safeInternalPath(path: string, fallback = "/dashboard"): string {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("\r") ||
    path.includes("\n")
  ) {
    return fallback;
  }

  return path;
}

export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && error.name === "AuthRetryableFetchError")
  );
}

export function getPublicAuthError(error: unknown): string {
  if (isNetworkError(error)) {
    return "We couldn’t reach the authentication service. Check your connection and try again.";
  }
  return "We couldn’t complete that request. Please try again.";
}
