import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend";
import { renderTrialEndingEmail } from "@/lib/email/templates/trial-ending";
import { getAppUrl } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanType = "b2c_monthly" | "b2c_yearly" | "b2b_monthly";

const PLAN_LABEL: Record<PlanType, string> = {
  b2c_monthly: "개인 · 월간",
  b2c_yearly: "개인 · 연간",
  b2b_monthly: "학원 · 좌석제",
};

type Bucket = 3 | 1 | 0;
const BUCKET_COLUMN: Record<Bucket, string> = {
  3: "trial_reminder_3d_sent_at",
  1: "trial_reminder_1d_sent_at",
  0: "trial_reminder_0d_sent_at",
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service role 환경변수가 설정되지 않았습니다.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function formatKoreanDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function resolveRecipient(
  db: ReturnType<typeof adminClient>,
  sub: { user_id: string | null; academy_id: string | null },
): Promise<{ email: string; name: string } | null> {
  if (sub.user_id) {
    const { data: u } = await db
      .from("users")
      .select("email, name")
      .eq("id", sub.user_id)
      .maybeSingle();
    if (u?.email) return { email: u.email, name: u.name ?? "" };
    return null;
  }
  if (sub.academy_id) {
    const { data: a } = await db
      .from("academies")
      .select("contact_email, name")
      .eq("id", sub.academy_id)
      .maybeSingle();
    if (a?.contact_email) return { email: a.contact_email, name: a.name ?? "" };
    return null;
  }
  return null;
}

function pickBucket(
  daysRemaining: number,
  sub: {
    trial_reminder_3d_sent_at: string | null;
    trial_reminder_1d_sent_at: string | null;
    trial_reminder_0d_sent_at: string | null;
  },
): Bucket | null {
  if (daysRemaining <= 0 && !sub.trial_reminder_0d_sent_at) return 0;
  if (daysRemaining <= 1 && !sub.trial_reminder_1d_sent_at) return 1;
  if (daysRemaining <= 3 && !sub.trial_reminder_3d_sent_at) return 3;
  return null;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET이 설정되지 않았습니다." },
      { status: 500 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminClient();
  const now = Date.now();
  const windowEnd = new Date(now + 4 * 86400000).toISOString();

  const { data: subs, error } = await db
    .from("subscriptions")
    .select(
      "id, user_id, academy_id, plan_type, trial_ends_at, current_period_end, trial_reminder_3d_sent_at, trial_reminder_1d_sent_at, trial_reminder_0d_sent_at",
    )
    .eq("status", "trialing")
    .not("trial_ends_at", "is", null)
    .lte("trial_ends_at", windowEnd);

  if (error) {
    console.error("[cron trial-reminders] 조회 실패", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = getAppUrl();
  const manageUrl = `${appUrl}/learn/me`;
  const results: Array<{
    id: string;
    bucket: Bucket;
    to: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const sub of subs ?? []) {
    const daysRemaining = Math.ceil(
      (new Date(sub.trial_ends_at as string).getTime() - now) / 86400000,
    );
    const bucket = pickBucket(daysRemaining, sub);
    if (bucket === null) continue;

    const recipient = await resolveRecipient(db, sub);
    if (!recipient) continue;

    const { subject, html } = renderTrialEndingEmail({
      recipientName: recipient.name,
      bucket,
      planLabel: PLAN_LABEL[sub.plan_type as PlanType] ?? sub.plan_type,
      trialEndDate: formatKoreanDate(sub.trial_ends_at as string),
      nextBillingDate: formatKoreanDate(
        (sub.current_period_end as string | null) ?? (sub.trial_ends_at as string),
      ),
      manageUrl,
    });

    try {
      await sendEmail({ to: recipient.email, subject, html });
      await db
        .from("subscriptions")
        .update({ [BUCKET_COLUMN[bucket]]: new Date().toISOString() })
        .eq("id", sub.id);
      results.push({ id: sub.id, bucket, to: recipient.email, ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[cron trial-reminders] 발송 실패", sub.id, bucket, message);
      results.push({
        id: sub.id,
        bucket,
        to: recipient.email,
        ok: false,
        error: message,
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
