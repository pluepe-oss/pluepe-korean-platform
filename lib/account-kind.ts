import { createClient } from "@/lib/supabase/server";

// 사용 예시: const ctx = await getAccountContext(user.id);

export type AccountKind = "b2b" | "b2c_active" | "trialing" | "expired" | "none";

export interface AccountContext {
  kind: AccountKind;
  planType: "topik1" | "topik2" | "eps" | null;
  planTier: "basic" | "premium" | null;
  trialEnd: Date | null;
  currentPeriodEnd: Date | null;
  daysRemaining: number | null;
  academyName: string | null;
}

function daysUntil(target: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diff = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}

// academies 테이블에 plan_type/plan_tier 컬럼이 없어 B2B 플랜 정보도 subscriptions 에서 조회한다.
// academies 테이블은 B2B 헤더에 노출할 학원명(academyName) 표시용으로만 사용.
export async function getAccountContext(userId: string): Promise<AccountContext> {
  const supabase = await createClient();
  // [DEBUG] 진단용 로그 — 원인 파악 후 제거 예정
  console.log("[getAccountContext] userId=", userId);

  const { data: profile } = await supabase
    .from("users")
    .select("academy_id")
    .eq("id", userId)
    .single();
  console.log("[getAccountContext] profile=", profile);

  // ── 1순위: users.academy_id 있음 → B2B 분기 ──
  if (profile?.academy_id) {
    const { data: academy } = await supabase
      .from("academies")
      .select("name")
      .eq("id", profile.academy_id)
      .single();
    const academyName = academy?.name ?? null;

    const { data: b2bSubs } = await supabase
      .from("subscriptions")
      .select("plan_type, plan_tier, trial_ends_at, current_period_end")
      .eq("academy_id", profile.academy_id)
      .in("status", ["active", "trialing"])
      .order("current_period_end", { ascending: false })
      .limit(1);

    const b2bSub = b2bSubs?.[0] ?? null;

    if (!b2bSub) {
      return {
        kind: "expired",
        planType: null,
        planTier: null,
        trialEnd: null,
        currentPeriodEnd: null,
        daysRemaining: null,
        academyName,
      };
    }

    return {
      kind: "b2b",
      planType: (b2bSub.plan_type ?? null) as AccountContext["planType"],
      planTier: (b2bSub.plan_tier ?? null) as AccountContext["planTier"],
      trialEnd: b2bSub.trial_ends_at ? new Date(b2bSub.trial_ends_at) : null,
      currentPeriodEnd: b2bSub.current_period_end ? new Date(b2bSub.current_period_end) : null,
      daysRemaining: null,
      academyName,
    };
  }

  // ── 2순위: B2C subscription 조회 (user_id 기준, academy_id 없는 경우만) ──
  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("status, plan_type, plan_tier, trial_ends_at, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  console.log("[getAccountContext] B2C sub=", sub, "error=", subError);

  if (!sub) {
    console.log("[getAccountContext] → kind='none' (구독 없음)");
    return {
      kind: "none",
      planType: null,
      planTier: null,
      trialEnd: null,
      currentPeriodEnd: null,
      daysRemaining: null,
      academyName: null,
    };
  }

  const now = new Date();
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
  const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const planType = (sub.plan_type ?? null) as AccountContext["planType"];
  const planTier = (sub.plan_tier ?? null) as AccountContext["planTier"];

  console.log(
    "[getAccountContext] 분기 판정 input:",
    "status=", sub.status,
    "trialEnd=", trialEnd?.toISOString() ?? null,
    "currentPeriodEnd=", currentPeriodEnd?.toISOString() ?? null,
    "now=", now.toISOString(),
  );

  // trialing: status='trialing' AND trial_end > NOW()
  if (sub.status === "trialing" && trialEnd && trialEnd > now) {
    console.log("[getAccountContext] → kind='trialing'");
    return {
      kind: "trialing",
      planType,
      planTier,
      trialEnd,
      currentPeriodEnd,
      daysRemaining: daysUntil(trialEnd),
      academyName: null,
    };
  }

  // b2c_active: status='active' AND current_period_end > NOW()
  if (sub.status === "active" && currentPeriodEnd && currentPeriodEnd > now) {
    console.log("[getAccountContext] → kind='b2c_active'");
    return {
      kind: "b2c_active",
      planType,
      planTier,
      trialEnd,
      currentPeriodEnd,
      daysRemaining: daysUntil(currentPeriodEnd),
      academyName: null,
    };
  }

  // 그 외 (만료된 active / canceled / past_due / incomplete 포함)
  console.log("[getAccountContext] → kind='expired' (fallback)");
  return {
    kind: "expired",
    planType,
    planTier,
    trialEnd,
    currentPeriodEnd,
    daysRemaining: null,
    academyName: null,
  };
}
