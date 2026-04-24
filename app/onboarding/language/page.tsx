"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LangCode = "vi" | "en" | "zh" | "id";

type LangOption = {
  code: LangCode;
  koreanName: string;
  flag: string;
  nativeName: string;
};

const ALL_LANGS: Record<LangCode, LangOption> = {
  vi: { code: "vi", koreanName: "베트남어", flag: "🇻🇳", nativeName: "Tiếng Việt" },
  en: { code: "en", koreanName: "영어", flag: "🇺🇸", nativeName: "English" },
  zh: { code: "zh", koreanName: "중국어", flag: "🇨🇳", nativeName: "中文" },
  id: { code: "id", koreanName: "인도네시아어", flag: "🇮🇩", nativeName: "Bahasa Indonesia" },
};

function resolveLangOptions(plan: string): LangOption[] {
  const p = plan.toLowerCase();
  if (p.includes("eps")) {
    return [ALL_LANGS.vi, ALL_LANGS.en, ALL_LANGS.id];
  }
  return [ALL_LANGS.vi, ALL_LANGS.en, ALL_LANGS.zh];
}

function LanguageSelectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const plan = searchParams.get("plan");

  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<LangCode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) {
      router.replace("/pricing");
      return;
    }

    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("preferred_language")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;

      const lang = profile?.preferred_language;
      if (lang !== null && lang !== undefined) {
        alert("이미 언어가 설정되어 있습니다. 관리자에게 문의하세요.");
        router.replace("/my");
        return;
      }

      setUserId(user.id);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [plan, router, supabase]);

  const langOptions = plan ? resolveLangOptions(plan) : [];
  const selectedLang = selected ? ALL_LANGS[selected] : null;

  async function handleConfirm() {
    if (!selected || !userId || !plan) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("users")
      .update({ preferred_language: selected })
      .eq("id", userId);

    if (updateError) {
      setError("언어 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
      return;
    }

    router.push(
      `/onboarding/checkout?plan=${encodeURIComponent(plan)}&lang=${selected}`,
    );
  }

  if (!ready) {
    return (
      <main
        className="min-h-dvh flex items-center justify-center"
        style={{ background: "#f4f5f7" }}
      >
        <div style={{ fontSize: 14, color: "#64748b" }}>불러오는 중…</div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-10" style={{ background: "#f4f5f7" }}>
      <div className="mx-auto w-full" style={{ maxWidth: 480 }}>
        <header className="text-center">
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
            학습 언어를 선택하세요
          </h1>
          <p className="mt-2" style={{ fontSize: 15, color: "#64748b" }}>
            선택한 언어로 모든 학습 콘텐츠가 제공됩니다
          </p>
        </header>

        <div
          className="mt-6 px-4 py-3"
          style={{
            background: "#fff7ed",
            borderRadius: 12,
            color: "#c2410c",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          ⚠ 선택 후 변경이 어렵습니다. 신중하게 선택해 주세요.
        </div>

        <div className="mt-6 space-y-3">
          {langOptions.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelected(lang.code)}
                className="w-full flex items-center gap-4 text-left"
                style={{
                  background: "#ffffff",
                  borderRadius: 22,
                  padding: 20,
                  border: isSelected
                    ? "2px solid #122c4f"
                    : "2px solid transparent",
                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                  cursor: "pointer",
                  transition: "border-color 0.15s ease",
                }}
              >
                <span style={{ fontSize: 36, lineHeight: 1 }}>{lang.flag}</span>
                <span className="flex flex-col">
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {lang.koreanName}
                  </span>
                  <span style={{ fontSize: 14, color: "#64748b" }}>
                    {lang.nativeName}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selected}
          onClick={() => setShowModal(true)}
          className="w-full mt-8"
          style={{
            background: selected ? "#122c4f" : "#e2e8f0",
            color: selected ? "#ffffff" : "#94a3b8",
            borderRadius: 12,
            padding: "14px 24px",
            fontSize: 15,
            fontWeight: 600,
            cursor: selected ? "pointer" : "not-allowed",
          }}
        >
          선택 완료
        </button>

        {error && (
          <p
            className="mt-4 text-center"
            style={{ color: "#ef4444", fontSize: 14 }}
          >
            {error}
          </p>
        )}
      </div>

      {showModal && selectedLang && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ background: "rgba(15, 23, 42, 0.5)", zIndex: 50 }}
          onClick={() => {
            if (!saving) setShowModal(false);
          }}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full"
            style={{
              maxWidth: 320,
              background: "#ffffff",
              borderRadius: 22,
              padding: 24,
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-center"
              style={{ fontSize: 18, fontWeight: 600, color: "#0f172a" }}
            >
              {selectedLang.koreanName}로 학습하시겠어요?
            </h2>
            <p
              className="mt-3 text-center"
              style={{ fontSize: 14, color: "#64748b" }}
            >
              선택 후에는 변경이 어렵습니다.
            </p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowModal(false)}
                className="flex-1"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #122c4f",
                  color: "#122c4f",
                  borderRadius: 12,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                다시 선택
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirm}
                className="flex-1"
                style={{
                  background: "#122c4f",
                  color: "#ffffff",
                  borderRadius: 12,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "저장 중…" : "네, 확정합니다"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function LanguageOnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh" style={{ background: "#f4f5f7" }} />
      }
    >
      <LanguageSelectInner />
    </Suspense>
  );
}
