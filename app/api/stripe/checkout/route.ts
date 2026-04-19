import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe, STRIPE_PRICE_IDS, getAppUrl, type PlanType } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { plan_type?: string };
    const plan = body.plan_type as PlanType | undefined;

    if (!plan || !(plan in STRIPE_PRICE_IDS)) {
      return NextResponse.json({ error: "잘못된 plan_type입니다." }, { status: 400 });
    }
    const priceId = STRIPE_PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe Price ID가 설정되지 않았습니다: ${plan}` },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("email, academy_id, role")
      .eq("id", user.id)
      .maybeSingle();

    const stripe = getStripe();
    const appUrl = getAppUrl();

    const isB2B = plan === "b2b_monthly";
    const metadata: Record<string, string> = {
      plan_type: plan,
      user_id: user.id,
    };
    if (isB2B && profile?.academy_id) {
      metadata.academy_id = profile.academy_id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata,
      },
      customer_email: profile?.email ?? user.email ?? undefined,
      client_reference_id: user.id,
      metadata,
      success_url: `${appUrl}/learn?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancel`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout URL이 없습니다." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      console.error("[stripe checkout] Stripe 오류", err.code, err.message);
      return NextResponse.json(
        {
          error: `Stripe 오류: ${err.message}`,
          code: err.code ?? null,
          param: err.param ?? null,
        },
        { status: err.statusCode ?? 500 }
      );
    }
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[stripe checkout] 처리 실패", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
