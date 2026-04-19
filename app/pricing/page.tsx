import { createClient } from "@/lib/supabase/server";
import PricingCards from "./pricing-cards";

type PlanRow = {
  plan_type: "b2c_monthly" | "b2c_yearly" | "b2b_monthly";
  interval: "month" | "year";
  amount_cents: number;
  currency: string;
};

async function loadPrices(
  supabase: Awaited<ReturnType<typeof createClient>>,
  countryCode: string | null,
  academyId: string | null
): Promise<PlanRow[]> {
  const plans: Array<{ plan: PlanRow["plan_type"]; interval: PlanRow["interval"] }> = [
    { plan: "b2c_monthly", interval: "month" },
    { plan: "b2c_yearly", interval: "year" },
    { plan: "b2b_monthly", interval: "month" },
  ];

  const rows: PlanRow[] = [];
  for (const { plan, interval } of plans) {
    const { data } = await supabase.rpc("resolve_price", {
      p_plan_type: plan,
      p_interval: interval,
      p_country: countryCode,
      p_academy: academyId,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      rows.push({
        plan_type: plan,
        interval,
        amount_cents: row.amount_cents,
        currency: row.currency,
      });
    }
  }
  return rows;
}

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let countryCode: string | null = null;
  let academyId: string | null = null;
  let isLoggedIn = false;
  if (user) {
    isLoggedIn = true;
    const { data: profile } = await supabase
      .from("users")
      .select("country_code, academy_id")
      .eq("id", user.id)
      .maybeSingle();
    countryCode = profile?.country_code ?? null;
    academyId = profile?.academy_id ?? null;
  }

  const prices = await loadPrices(supabase, countryCode, academyId);

  return (
    <main className="min-h-dvh bg-gray-50 px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">요금제</h1>
          <p className="mt-2 text-sm text-gray-500">
            모든 플랜 7일 무료체험 · 체험 종료 전 해지 시 요금 청구 없음
          </p>
        </header>

        <div className="mt-8">
          <PricingCards prices={prices} isLoggedIn={isLoggedIn} />
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          결제는 Stripe를 통해 안전하게 처리되며, 해지는 언제든 마이페이지에서 가능합니다.
        </p>
      </div>
    </main>
  );
}
