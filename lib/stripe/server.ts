import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY가 설정되지 않았습니다.");
  }
  cached = new Stripe(key);
  return cached;
}

export const STRIPE_PRICE_IDS = {
  b2c_monthly: process.env.STRIPE_PRICE_B2C_MONTHLY ?? "",
  b2c_yearly: process.env.STRIPE_PRICE_B2C_YEARLY ?? "",
  b2b_monthly: process.env.STRIPE_PRICE_B2B_MONTHLY ?? "",
} as const;

export type PlanType = keyof typeof STRIPE_PRICE_IDS;

// 2026.04.26 확정 상품 체계: (topik1 | topik2 | eps) × (basic | premium) × (monthly | yearly)
export type Product = "topik1" | "topik2" | "eps";
export type Tier = "basic" | "premium";
export type Interval = "monthly" | "yearly";

export const PRICE_ID_MAP: Record<Product, Record<Tier, Record<Interval, string>>> = {
  topik1: {
    basic: {
      monthly: process.env.STRIPE_PRICE_T1_B_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_T1_B_YEARLY ?? "",
    },
    premium: {
      monthly: process.env.STRIPE_PRICE_T1_P_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_T1_P_YEARLY ?? "",
    },
  },
  topik2: {
    basic: {
      monthly: process.env.STRIPE_PRICE_T2_B_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_T2_B_YEARLY ?? "",
    },
    premium: {
      monthly: process.env.STRIPE_PRICE_T2_P_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_T2_P_YEARLY ?? "",
    },
  },
  eps: {
    basic: {
      monthly: process.env.STRIPE_PRICE_EPS_B_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_EPS_B_YEARLY ?? "",
    },
    premium: {
      monthly: process.env.STRIPE_PRICE_EPS_P_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_EPS_P_YEARLY ?? "",
    },
  },
};

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
