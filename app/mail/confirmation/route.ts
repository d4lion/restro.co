import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successfully authenticated via email confirmation link!
      // Redirect to onboarding with session cookies active.
      return NextResponse.redirect(new URL(next, request.url));
    }

    console.error("Exchange code for session error:", error);
  }

  // If code is invalid or missing, redirect to login with error
  return NextResponse.redirect(new URL("/login?error=invalid_confirmation_code", request.url));
}
