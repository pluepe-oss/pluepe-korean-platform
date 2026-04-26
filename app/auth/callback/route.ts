import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveLoginDestination } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=exchange_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/auth?error=no_user`);
  }

  const dest = await resolveLoginDestination(user.id);
  return NextResponse.redirect(`${origin}${dest}`);
}
