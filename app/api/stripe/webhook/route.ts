import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";
type PlanType = "b2c_monthly" | "b2c_yearly" | "b2b_monthly";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service role 환경변수가 설정되지 않았습니다.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function mapStatus(status: Stripe.Subscription.Status): SubStatus {
  switch (status) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "incomplete":
      return status;
    case "incomplete_expired":
      return "incomplete";
    case "unpaid":
      return "past_due";
    case "paused":
      return "canceled";
    default:
      return "incomplete";
  }
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const metadata = sub.metadata ?? {};
  const planType = metadata.plan_type as PlanType | undefined;
  const userId = metadata.user_id as string | undefined;
  const academyId = metadata.academy_id as string | undefined;

  if (!planType) {
    console.warn("[stripe webhook] plan_type metadata 없음, skip", sub.id);
    return;
  }

  const item = sub.items.data[0];
  const periodEndUnix = (item as unknown as { current_period_end?: number })
    ?.current_period_end;
  const currentPeriodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null;
  const trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const isB2B = planType === "b2b_monthly";
  const row = {
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
    status: mapStatus(sub.status),
    plan_type: planType,
    seats: sub.items.data[0]?.quantity ?? 1,
    trial_ends_at: trialEndsAt,
    current_period_end: currentPeriodEnd,
    user_id: isB2B ? null : userId ?? null,
    academy_id: isB2B ? academyId ?? null : null,
  };

  const db = adminClient();
  const { error } = await db
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) {
    console.error("[stripe webhook] subscriptions upsert 실패", error);
    throw error;
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET이 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "stripe-signature 없음" }, { status: 400 });
  }

  const stripe = getStripe();
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서명 검증 실패";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub);

          // 결제 완료 → users.intended_plan 초기화 (resume 카드 노출 방지)
          const userId =
            (sub.metadata?.user_id as string | undefined) ??
            (session.client_reference_id ?? undefined);
          if (userId) {
            const db = adminClient();
            const { error: clearErr } = await db
              .from("users")
              .update({ intended_plan: null })
              .eq("id", userId);
            if (clearErr) {
              console.error(
                "[stripe webhook] intended_plan 초기화 실패",
                clearErr,
              );
            }
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] 처리 중 오류", err);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
