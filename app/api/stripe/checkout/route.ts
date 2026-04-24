import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  getAppUrl,
  PRICE_ID_MAP,
  type Product,
  type Tier,
  type Interval,
} from "@/lib/stripe/server";

type Body = {
  product?: string;
  language?: string;
  plan?: string; // 'trial' | 'basic' | 'premium'
  interval?: string;
};

const PRODUCTS: Product[] = ["topik1", "topik2", "eps"];
const TIERS: Tier[] = ["basic", "premium"];
const INTERVALS: Interval[] = ["monthly", "yearly"];
const LANGUAGES = ["vi", "en", "zh", "id"] as const;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Body;
    const { product, language, plan, interval } = body;

    if (!product || !PRODUCTS.includes(product as Product)) {
      return NextResponse.json(
        { error: "잘못된 product 값입니다." },
        { status: 400 },
      );
    }
    if (!plan || !["trial", "basic", "premium"].includes(plan)) {
      return NextResponse.json(
        { error: "잘못된 plan 값입니다." },
        { status: 400 },
      );
    }
    if (!interval || !INTERVALS.includes(interval as Interval)) {
      return NextResponse.json(
        { error: "잘못된 interval 값입니다." },
        { status: 400 },
      );
    }
    if (language && !LANGUAGES.includes(language as (typeof LANGUAGES)[number])) {
      return NextResponse.json(
        { error: "잘못된 language 값입니다." },
        { status: 400 },
      );
    }

    // plan='trial' 은 실제로 basic 요금제로 7일 trial 진행
    const tier: Tier = plan === "premium" ? "premium" : "basic";
    const priceId =
      PRICE_ID_MAP[product as Product]?.[tier]?.[interval as Interval];
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe Price ID가 설정되지 않았습니다: ${product}/${tier}/${interval}`,
        },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    const stripe = getStripe();
    const appUrl = getAppUrl();

    const metadata: Record<string, string> = {
      plan_type: product,
      plan_tier: tier,
      interval,
      plan_intent: plan, // 'trial' | 'basic' | 'premium' — 원본 선택
      user_id: user.id,
    };
    if (language) metadata.language = language;

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
      success_url: `${appUrl}/my`,
      cancel_url: `${appUrl}/pricing`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout URL이 없습니다." },
        { status: 500 },
      );
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
        { status: err.statusCode ?? 500 },
      );
    }
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[stripe checkout] 처리 실패", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
