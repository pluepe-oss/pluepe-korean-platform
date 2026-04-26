'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';

type Product = 'topik1' | 'topik2' | 'eps';
type Language = 'vi' | 'en' | 'zh' | 'id';
type Plan = 'trial' | 'basic' | 'premium';
type Interval = 'monthly' | 'yearly';
type Step = 1 | 2 | 4;

const COLOR = {
  navy: '#122c4f',
  mint: '#27d3c3',
  orange: '#ff7d5a',
  bg: '#edf2f7',
  white: '#ffffff',
  text: '#0f172a',
  sub: '#64748b',
  border: '#e2e8f0',
  disabledBg: '#e2e8f0',
  disabledText: '#94a3b8',
  err: '#ef4444',
} as const;

const PRODUCT_META: Record<
  Product,
  { label: string; desc: string; units: number; langs: Language[] }
> = {
  topik1: {
    label: 'TOPIK 1',
    desc: '생존 회화 + 일상 표현',
    units: 15,
    langs: ['vi', 'en', 'zh'],
  },
  topik2: {
    label: 'TOPIK 2',
    desc: '읽기/쓰기 + 고급 표현',
    units: 20,
    langs: ['vi', 'en', 'zh'],
  },
  eps: {
    label: 'EPS-TOPIK',
    desc: '산업 현장 + 취업 한국어',
    units: 20,
    langs: ['vi', 'en', 'id'],
  },
};

const LANGUAGE_META: Record<Language, { flag: string; label: string }> = {
  vi: { flag: '🇻🇳', label: '베트남어' },
  en: { flag: '🇬🇧', label: '영어' },
  zh: { flag: '🇨🇳', label: '중국어' },
  id: { flag: '🇮🇩', label: '인도네시아어' },
};

const PRICES: Record<
  Product,
  Record<'basic' | 'premium', Record<Interval, number>>
> = {
  topik1: {
    basic: { monthly: 12.9, yearly: 92.9 },
    premium: { monthly: 19.9, yearly: 142.9 },
  },
  topik2: {
    basic: { monthly: 16.9, yearly: 121.9 },
    premium: { monthly: 24.9, yearly: 179.9 },
  },
  eps: {
    basic: { monthly: 14.9, yearly: 106.9 },
    premium: { monthly: 22.9, yearly: 164.9 },
  },
};

const RESPONSIVE_CSS = `
  .px-card { transition: border-color 0.15s, box-shadow 0.15s; }
  .px-card:hover { box-shadow: 0 10px 24px rgba(15,23,42,0.12); }
  @media (max-width: 640px) {
    .px-container { padding: 16px !important; max-width: 100% !important; }
    .px-hero-title { font-size: 22px !important; }
  }
  @keyframes px-spin { to { transform: rotate(360deg); } }
`;

function formatPrice(n: number): string {
  return n.toFixed(2);
}

function Progress({ step }: { step: Step }) {
  const percent = (step / 4) * 100;
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          fontSize: 13,
          color: COLOR.sub,
          fontWeight: 500,
        }}
      >
        <span>Step {step} / 4</span>
      </div>
      <div
        style={{
          height: 6,
          background: COLOR.border,
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: COLOR.mint,
            transition: 'width 0.25s ease',
          }}
        />
      </div>
    </div>
  );
}

function CardBase({
  selected,
  onClick,
  children,
  disabled,
  badge,
}: {
  selected: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  badge?: { label: string; color: string };
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="px-card"
      style={{
        position: 'relative',
        width: '100%',
        background: COLOR.white,
        border: `2px solid ${selected ? COLOR.navy : COLOR.border}`,
        borderRadius: 22,
        padding: 20,
        textAlign: 'left',
        boxShadow: selected
          ? '0 12px 30px rgba(18,44,79,0.18)'
          : '0 6px 16px rgba(15,23,42,0.06)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
      }}
    >
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: -10,
            right: 16,
            background: badge.color,
            color: COLOR.navy,
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 999,
            letterSpacing: '0.3px',
          }}
        >
          {badge.label}
        </span>
      )}
      {children}
    </button>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
  variant = 'navy',
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'navy' | 'orange';
}) {
  const isDisabled = disabled || loading;
  const bg =
    isDisabled
      ? COLOR.disabledBg
      : variant === 'orange'
        ? COLOR.orange
        : COLOR.navy;
  const color = isDisabled ? COLOR.disabledText : COLOR.white;
  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={{
        width: '100%',
        background: bg,
        color,
        border: 'none',
        borderRadius: 12,
        padding: '14px 24px',
        fontSize: 15,
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'inherit',
      }}
    >
      {loading ? (
        <span
          aria-hidden="true"
          style={{
            width: 16,
            height: 16,
            border: `2px solid ${color}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'px-spin 0.8s linear infinite',
          }}
        />
      ) : null}
      {children}
    </button>
  );
}

const INTENDED_PLAN_LABEL: Record<string, string> = {
  topik1_basic: 'TOPIK 1 Basic',
  topik1_premium: 'TOPIK 1 Premium',
  topik2_basic: 'TOPIK 2 Basic',
  topik2_premium: 'TOPIK 2 Premium',
  eps_basic: 'EPS-TOPIK Basic',
  eps_premium: 'EPS-TOPIK Premium',
};

function parseIntendedPlan(
  raw: string | null,
): { product: Product; tier: 'basic' | 'premium' } | null {
  if (!raw) return null;
  const [p, t] = raw.split('_');
  if (p !== 'topik1' && p !== 'topik2' && p !== 'eps') return null;
  if (t !== 'basic' && t !== 'premium') return null;
  return { product: p as Product, tier: t as 'basic' | 'premium' };
}

function PricingFunnel() {
  const searchParams = useSearchParams();
  const resumeRequested = searchParams.get('resume') === 'true';
  const initialProduct = (() => {
    const raw = searchParams.get('product');
    if (raw === 'topik1' || raw === 'topik2' || raw === 'eps') return raw;
    return null;
  })();

  const [step, setStep] = useState<Step>(initialProduct ? 2 : 1);
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [language, setLanguage] = useState<Language | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [interval, setIntervalState] = useState<Interval>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // resume 플로우용 — 현재 사용자 + 저장된 intended_plan
  const [userId, setUserId] = useState<string | null>(null);
  const [intendedPlan, setIntendedPlan] = useState<string | null>(null);
  const [showResumeCard, setShowResumeCard] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          if (!cancelled) setProfileLoaded(true);
          return;
        }
        const { data } = await supabase
          .from('users')
          .select('intended_plan')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled) return;
        setUserId(user.id);
        const saved = (data?.intended_plan as string | null) ?? null;
        setIntendedPlan(saved);
        if (resumeRequested && saved) setShowResumeCard(true);
      } finally {
        if (!cancelled) setProfileLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeRequested]);

  // intended_plan 저장 헬퍼 (비로그인 silent skip)
  const saveIntendedPlan = async (value: string | null) => {
    if (!userId) return;
    try {
      const supabase = createBrowserSupabase();
      await supabase
        .from('users')
        .update({ intended_plan: value })
        .eq('id', userId);
      setIntendedPlan(value);
    } catch (err) {
      console.error('[pricing] intended_plan 저장 실패', err);
    }
  };

  const handleResume = () => {
    const parsed = parseIntendedPlan(intendedPlan);
    if (!parsed) {
      setShowResumeCard(false);
      return;
    }
    setProduct(parsed.product);
    setPlan(parsed.tier);
    setShowResumeCard(false);
    // STEP 4 는 결제 스텝 — language 가 비어 있으면 STEP 2(언어 선택) 로 우회
    setStep(language ? 4 : 2);
  };

  const handleStartOver = async () => {
    await saveIntendedPlan(null);
    setShowResumeCard(false);
    setProduct(null);
    setLanguage(null);
    setPlan(null);
    setStep(1);
  };

  const handleStep1Next = async () => {
    if (!product) return;
    // STEP 1 완료 시 intended_plan 저장 (기본 tier=basic 으로 잠정, STEP 4 에서 확정값으로 덮어씀)
    await saveIntendedPlan(`${product}_basic`);
    setStep(2);
  };

  const selectPlan = async (p: Plan) => {
    setPlan(p);
    // basic/premium 선택 시 intended_plan 확정 업데이트 (trial 은 저장하지 않음)
    if (product && (p === 'basic' || p === 'premium')) {
      await saveIntendedPlan(`${product}_${p}`);
    }
  };

  const availableLanguages = useMemo<Language[]>(
    () => (product ? PRODUCT_META[product].langs : []),
    [product],
  );

  const startCheckout = async (chosenPlan: Plan) => {
    if (!product || !language) {
      setError('상품·언어를 먼저 선택해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          language,
          plan: chosenPlan,
          interval,
        }),
      });
      const text = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || 'Unknown response' };
      }
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('Checkout URL을 받지 못했습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 시작 실패');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <h1
        className="px-hero-title"
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: COLOR.text,
          margin: 0,
          marginBottom: 8,
          letterSpacing: '-0.3px',
        }}
      >
        어떤 과정을 학습하시겠어요?
      </h1>
      <p
        style={{
          fontSize: 14,
          color: COLOR.sub,
          margin: 0,
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        목표에 맞는 상품을 선택해주세요.
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {(Object.keys(PRODUCT_META) as Product[]).map((p) => {
          const meta = PRODUCT_META[p];
          return (
            <CardBase
              key={p}
              selected={product === p}
              onClick={() => setProduct(p)}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLOR.mint,
                  letterSpacing: '0.4px',
                  marginBottom: 6,
                }}
              >
                {meta.label}
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: COLOR.text,
                  marginBottom: 6,
                }}
              >
                {meta.desc}
              </div>
              <div style={{ fontSize: 13, color: COLOR.sub, marginBottom: 10 }}>
                총 {meta.units}개 주제
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {meta.langs.map((l) => (
                  <span
                    key={l}
                    style={{
                      fontSize: 12,
                      background: COLOR.bg,
                      color: COLOR.sub,
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontWeight: 500,
                    }}
                  >
                    {LANGUAGE_META[l].flag} {LANGUAGE_META[l].label}
                  </span>
                ))}
              </div>
            </CardBase>
          );
        })}
      </div>

      <PrimaryButton onClick={handleStep1Next} disabled={!product}>
        다음 →
      </PrimaryButton>
    </>
  );

  const renderStep2 = () => (
    <>
      <h1
        className="px-hero-title"
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: COLOR.text,
          margin: 0,
          marginBottom: 8,
          letterSpacing: '-0.3px',
        }}
      >
        학습 언어를 선택해주세요
      </h1>
      <p
        style={{
          fontSize: 14,
          color: COLOR.sub,
          margin: 0,
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        모국어로 설명과 번역을 제공합니다.
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {availableLanguages.map((l) => {
          const meta = LANGUAGE_META[l];
          return (
            <CardBase
              key={l}
              selected={language === l}
              onClick={() => setLanguage(l)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{meta.flag}</span>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: COLOR.text,
                  }}
                >
                  {meta.label}
                </span>
              </div>
            </CardBase>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {!initialProduct && (
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{
              flex: '0 0 auto',
              background: COLOR.white,
              border: `1.5px solid ${COLOR.navy}`,
              color: COLOR.navy,
              borderRadius: 12,
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ← 이전
          </button>
        )}
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={() => setStep(4)} disabled={!language}>
            다음 →
          </PrimaryButton>
        </div>
      </div>
    </>
  );

  const renderStep4 = () => {
    if (!product) return null;
    const priceSet = PRICES[product];
    const unit = interval === 'yearly' ? '/ 년' : '/ 월';

    return (
      <>
        <h1
          className="px-hero-title"
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: COLOR.text,
            margin: 0,
            marginBottom: 8,
            letterSpacing: '-0.3px',
          }}
        >
          플랜을 선택해주세요
        </h1>
        <p
          style={{
            fontSize: 14,
            color: COLOR.sub,
            margin: 0,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          언제든 해지 가능 · 7일 무료체험 제공
        </p>

        <div
          style={{
            display: 'inline-flex',
            background: COLOR.bg,
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
            gap: 4,
          }}
        >
          {(['monthly', 'yearly'] as Interval[]).map((iv) => {
            const active = interval === iv;
            return (
              <button
                key={iv}
                type="button"
                onClick={() => setIntervalState(iv)}
                style={{
                  background: active ? COLOR.white : 'transparent',
                  color: active ? COLOR.navy : COLOR.sub,
                  border: 'none',
                  borderRadius: 9,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'inherit',
                  boxShadow: active
                    ? '0 2px 6px rgba(15,23,42,0.08)'
                    : 'none',
                }}
              >
                {iv === 'monthly' ? '월간' : '연간'}
                {iv === 'yearly' && (
                  <span
                    style={{
                      background: COLOR.mint,
                      color: COLOR.navy,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 999,
                    }}
                  >
                    2개월 무료
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginBottom: 20,
          }}
        >
          <CardBase
            selected={plan === 'trial'}
            onClick={() => selectPlan('trial')}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLOR.orange,
                letterSpacing: '0.4px',
                marginBottom: 6,
              }}
            >
              7일 무료체험
            </div>
            <div style={{ marginBottom: 10 }}>
              <span
                style={{ fontSize: 28, fontWeight: 800, color: COLOR.text }}
              >
                $0
              </span>
              <span style={{ fontSize: 13, color: COLOR.sub, marginLeft: 6 }}>
                · 7일 이후 Basic 요금으로 전환
              </span>
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: 4,
              }}
            >
              <li style={{ fontSize: 13, color: COLOR.text }}>
                ✓ 선택 상품 주제 1개 체험
              </li>
              <li style={{ fontSize: 13, color: COLOR.text }}>
                ✓ 언제든 해지 가능 (7일 내)
              </li>
            </ul>
          </CardBase>

          <CardBase
            selected={plan === 'basic'}
            onClick={() => selectPlan('basic')}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLOR.navy,
                letterSpacing: '0.4px',
                marginBottom: 6,
              }}
            >
              Basic
            </div>
            <div style={{ marginBottom: 10 }}>
              <span
                style={{ fontSize: 28, fontWeight: 800, color: COLOR.text }}
              >
                ${formatPrice(priceSet.basic[interval])}
              </span>
              <span style={{ fontSize: 13, color: COLOR.sub, marginLeft: 6 }}>
                {unit}
              </span>
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: 4,
              }}
            >
              <li style={{ fontSize: 13, color: COLOR.text }}>✓ 전체 주제 접근</li>
              <li style={{ fontSize: 13, color: COLOR.text }}>
                ✓ 단어 / 패턴 훈련
              </li>
              <li style={{ fontSize: 13, color: COLOR.text }}>✓ 기본 AI 회화</li>
            </ul>
          </CardBase>

          <CardBase
            selected={plan === 'premium'}
            onClick={() => selectPlan('premium')}
            badge={{ label: '인기', color: COLOR.mint }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLOR.navy,
                letterSpacing: '0.4px',
                marginBottom: 6,
              }}
            >
              Premium
            </div>
            <div style={{ marginBottom: 10 }}>
              <span
                style={{ fontSize: 28, fontWeight: 800, color: COLOR.text }}
              >
                ${formatPrice(priceSet.premium[interval])}
              </span>
              <span style={{ fontSize: 13, color: COLOR.sub, marginLeft: 6 }}>
                {unit}
              </span>
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: 4,
              }}
            >
              <li style={{ fontSize: 13, color: COLOR.text }}>
                ✓ Basic 전체 기능
              </li>
              <li style={{ fontSize: 13, color: COLOR.text }}>
                ✓ AI 첨삭 (주제당 5회)
              </li>
              <li style={{ fontSize: 13, color: COLOR.text }}>✓ 모의고사 3회</li>
              <li style={{ fontSize: 13, color: COLOR.text }}>
                ✓ 약점 리포트 + PDF
              </li>
            </ul>
          </CardBase>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: '#fef2f2',
              color: COLOR.err,
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={loading}
            style={{
              flex: '0 0 auto',
              background: COLOR.white,
              border: `1.5px solid ${COLOR.navy}`,
              color: COLOR.navy,
              borderRadius: 12,
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            ← 이전
          </button>
          <div style={{ flex: 1 }}>
            {plan === 'trial' ? (
              <PrimaryButton
                onClick={() => startCheckout('trial')}
                disabled={!plan}
                loading={loading}
                variant="orange"
              >
                무료로 시작하기 →
              </PrimaryButton>
            ) : plan === 'premium' ? (
              <PrimaryButton
                onClick={() => startCheckout('premium')}
                disabled={!plan}
                loading={loading}
              >
                Premium 구독하기 →
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={() => plan === 'basic' && startCheckout('basic')}
                disabled={plan !== 'basic'}
                loading={loading}
              >
                {plan === 'basic' ? 'Basic 구독하기 →' : '플랜을 선택해주세요'}
              </PrimaryButton>
            )}
          </div>
        </div>
      </>
    );
  };

  const resumeCard =
    showResumeCard && intendedPlan ? (
      <div
        style={{
          background: COLOR.white,
          border: `2px solid ${COLOR.orange}`,
          borderRadius: 22,
          padding: 20,
          marginBottom: 20,
          boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: COLOR.orange,
            letterSpacing: '0.4px',
            marginBottom: 6,
          }}
        >
          이전에 선택한 상품이 있어요
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: COLOR.text,
            marginBottom: 14,
          }}
        >
          {INTENDED_PLAN_LABEL[intendedPlan] ?? intendedPlan}을 진행 중이셨네요
        </div>
        <PrimaryButton onClick={handleResume} variant="orange">
          이어서 구독하기 →
        </PrimaryButton>
        <button
          type="button"
          onClick={handleStartOver}
          style={{
            marginTop: 10,
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: COLOR.sub,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '6px 0',
            textDecoration: 'underline',
          }}
        >
          처음부터 다시 선택
        </button>
      </div>
    ) : null;

  // profile 로딩 중에는 깜박임 방지용으로 스텝을 비워두고 카드만 대기
  if (!profileLoaded && resumeRequested) {
    return (
      <div
        className="px-container"
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: 24,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLOR.sub,
          fontSize: 14,
        }}
      >
        불러오는 중...
      </div>
    );
  }

  return (
    <div
      className="px-container"
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: 24,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {resumeCard}
      <Progress step={step} />
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 4 && renderStep4()}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div
      style={{
        background: COLOR.bg,
        minHeight: '100vh',
        fontFamily: 'Arial, "Noto Sans KR", sans-serif',
        color: COLOR.text,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
      <Suspense
        fallback={
          <div
            style={{
              maxWidth: 480,
              margin: '0 auto',
              padding: 24,
              fontSize: 14,
              color: COLOR.sub,
            }}
          >
            불러오는 중...
          </div>
        }
      >
        <PricingFunnel />
      </Suspense>
    </div>
  );
}
