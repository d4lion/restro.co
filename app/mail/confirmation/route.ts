import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successfully authenticated via email confirmation link!
      // Redirect to the visual confirmation success page with verified=true flag.
      return NextResponse.redirect(new URL("/mail/confirmed?verified=true", request.url));
    }

    console.error("Exchange code for session error:", error);
  }

  // If code is invalid or missing, redirect strictly to login with error
  return NextResponse.redirect(new URL("/login?error=invalid_confirmation_code", request.url));
}
