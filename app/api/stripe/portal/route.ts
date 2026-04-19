import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getAppUrl } from "@/lib/stripe/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("academy_id")
      .eq("id", user.id)
      .maybeSingle();

    let query = supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    query = profile?.academy_id
      ? query.or(`user_id.eq.${user.id},academy_id.eq.${profile.academy_id}`)
      : query.eq("user_id", user.id);

    const { data: subs } = await query;
    const customerId = subs?.[0]?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: "활성 구독이 없습니다." },
        { status: 404 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/learn/me`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      console.error("[stripe portal] Stripe 오류", err.code, err.message);
      return NextResponse.json(
        { error: `Stripe 오류: ${err.message}`, code: err.code ?? null },
        { status: err.statusCode ?? 500 },
      );
    }
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[stripe portal] 처리 실패", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
