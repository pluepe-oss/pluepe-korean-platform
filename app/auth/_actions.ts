"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveLoginDestination } from "@/lib/auth-redirect";

// Email/Password 로그인 성공 후 클라이언트가 호출하는 서버 액션.
// callback route 와 동일한 resolveLoginDestination 을 사용해 라우팅 로직을 단일화한다.
export async function getLoginDestination(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/auth";
  return resolveLoginDestination(user.id);
}
