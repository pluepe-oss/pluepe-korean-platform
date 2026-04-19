"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PlanRow = {
  plan_type: "b2c_monthly" | "b2c_yearly" | "b2b_monthly";
  interval: "month" | "year";
  amount_cents: number;
  currency: string;
};

const PLAN_META: Record<
  PlanRow["plan_type"],
  { title: string; tagline: string; bullets: string[]; unitNote?: string; highlight?: boolean }
> = {
  b2c_monthly: {
    title: "개인 · 월간",
    tagline: "부담 없이 시작",
    bullets: ["TOPIK 1/2 · EPS-TOPIK 전체 강의", "AI 챗봇 · 오답 해설", "모바일 PWA 지원"],
  },
  b2c_yearly: {
    title: "개인 · 연간",
    tagline: "2개월 무료 혜택",
    bullets: ["월간 혜택 전부", "연간 결제 시 약 25% 할인", "1년간 가격 고정"],
    highlight: true,
  },
  b2b_monthly: {
    title: "학원 · 좌석제",
    tagline: "B2B 학원 전용",
    unitNote: "좌석당",
    bullets: [
      "좌석 수만큼 학생 계정 배정",
      "Admin 대시보드 · 진도 리포트",
      "좌석 수 월 단위 조정",
    ],
  },
};

function formatPrice(cents: number, currency: string, interval: string) {
  const amount = (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
  const suffix = interval === "year" ? "/년" : "/월";
  return `${amount}${suffix}`;
}

export default function PricingCards({
  prices,
  isLoggedIn,
}: {
  prices: PlanRow[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [pendingPlan, setPendingPlan] = useState<PlanRow["plan_type"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: PlanRow["plan_type"]) {
    setError(null);
    if (!isLoggedIn) {
      router.push(`/auth?next=/pricing`);
      return;
    }
    setPendingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_type: plan }),
      });
      const raw = await res.text();
      let json: { url?: string; error?: string } = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          `서버가 JSON이 아닌 응답을 반환했습니다 (HTTP ${res.status}). 서버 로그를 확인해주세요.`
        );
      }
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? `결제 세션을 만들지 못했습니다 (HTTP ${res.status}).`);
      }
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setPendingPlan(null);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-3">
        {prices.map((p) => {
          const meta = PLAN_META[p.plan_type];
          const pending = pendingPlan === p.plan_type;
          return (
            <li
              key={p.plan_type}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                meta.highlight ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-200"
              }`}
            >
              <span className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                7일 무료체험
              </span>
              <div className="mt-2 text-xs font-semibold text-blue-600">{meta.tagline}</div>
              <div className="mt-1 text-lg font-bold">{meta.title}</div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatPrice(p.amount_cents, p.currency, p.interval)}
                </span>
                {meta.unitNote && (
                  <span className="text-xs text-gray-500">· {meta.unitNote}</span>
                )}
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
                {meta.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span aria-hidden="true" className="text-blue-600">
                      ·
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={pending}
                onClick={() => startCheckout(p.plan_type)}
                className={`mt-6 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60 ${
                  meta.highlight
                    ? "bg-blue-600 text-white active:bg-blue-700"
                    : "bg-gray-900 text-white active:bg-gray-700"
                }`}
              >
                {pending ? "이동 중..." : "7일 무료로 시작하기"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
