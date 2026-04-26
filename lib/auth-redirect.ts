import { createClient } from "@/lib/supabase/server";
import { getAccountContext } from "@/lib/account-kind";

// 로그인 직후 이동할 경로를 결정하는 단일 진실 공급원.
// app/auth/callback/route.ts (OAuth) 와 app/auth/_actions.ts (Email/Password 서버 액션)
// 양쪽에서 동일 로직을 공유한다.
//
// 우선순위:
//   1. preferred_language 미설정 → /onboarding/language
//   2. kind='none' + intended_plan 존재 → /pricing?resume=true
//   3. kind='none' → /pricing
//   4. kind ∈ {b2b, b2c_active, trialing, expired} → /my
//
// 에러 처리:
//   - users 조회 실패 → /my
//   - getAccountContext 실패 → /pricing
export async function resolveLoginDestination(userId: string): Promise<string> {
  const supabase = await createClient();
  // [DEBUG] 진단용 로그 — 원인 파악 후 제거 예정
  console.log("[resolveLoginDestination] userId=", userId);

  let profile: { preferred_language: string | null; intended_plan: string | null } | null = null;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("preferred_language, intended_plan")
      .eq("id", userId)
      .single();
    if (error) throw error;
    profile = data;
  } catch (err) {
    console.error("[auth-redirect] users 프로필 조회 실패 → /my fallback:", err);
    return "/my";
  }
  console.log("[resolveLoginDestination] profile=", profile);

  if (profile?.preferred_language == null) {
    console.log("[resolveLoginDestination] → /onboarding/language (preferred_language null)");
    return "/onboarding/language";
  }

  try {
    const ctx = await getAccountContext(userId);
    console.log("[resolveLoginDestination] ctx.kind=", ctx.kind, "intended_plan=", profile.intended_plan);
    if (ctx.kind === "none") {
      const dest = profile.intended_plan ? "/pricing?resume=true" : "/pricing";
      console.log("[resolveLoginDestination] → ", dest, " (kind=none)");
      return dest;
    }
    console.log("[resolveLoginDestination] → /my (kind=", ctx.kind, ")");
    return "/my";
  } catch (err) {
    console.error("[auth-redirect] getAccountContext 실패 → /pricing fallback:", err);
    return "/pricing";
  }
}
