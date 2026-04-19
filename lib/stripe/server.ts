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

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
