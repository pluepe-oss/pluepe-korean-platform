"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../unit.module.css";
import type { UnitData } from "../types";

type PromptState = {
  status: "idle" | "loading" | "ok" | "error";
  text: string;
};

const USED_KEY = (unitId: string, idx: number) =>
  `pluepe_ai_used_${unitId}_${idx}`;
// AI 응답 텍스트도 함께 저장 — 횟수 소진 후 재진입 시 복습용으로 펼쳐 보여준다
const RESPONSE_KEY = (unitId: string, idx: number) =>
  `pluepe_ai_response_${unitId}_${idx}`;

// Basic = 3개 / Premium = 5개 (기본 콘텐츠 최대치)
const BASIC_AI_LIMIT = 3;

export default function AISection({
  unit,
  onComplete,
  planTier = "basic",
  accountKind = "b2c_active",
}: {
  unit: UnitData;
  onComplete: () => void;
  /** 작업 3-1: Basic 은 AI 확장 3개만 노출, Premium 은 5개 모두 노출 */
  planTier?: "basic" | "premium" | null;
  /** 작업 4: trial / b2c / b2b / expired 분기에 따라 안내 배너 메시지 변경 */
  accountKind?: "b2b" | "b2c_active" | "trialing" | "expired" | "none";
}) {
  // Basic 사용자에게는 처음 3개만 표시 (trial 도 동일 — 3개 노출, 결제 후 Premium 시 5개)
  const visibleAI = useMemo(() => {
    if (planTier === "premium") return unit.ai_extension;
    return unit.ai_extension.slice(0, BASIC_AI_LIMIT);
  }, [unit.ai_extension, planTier]);
  const hasMoreForPremium =
    (planTier ?? "basic") !== "premium" &&
    unit.ai_extension.length > BASIC_AI_LIMIT;
  const additionalCount = unit.ai_extension.length - BASIC_AI_LIMIT;

  const [states, setStates] = useState<PromptState[]>(() =>
    unit.ai_extension.map(() => ({ status: "idle", text: "" })),
  );
  // 각 버튼의 "이미 사용됨" 플래그. localStorage 와 1:1 동기화.
  const [used, setUsed] = useState<boolean[]>(() =>
    unit.ai_extension.map(() => false),
  );
  const [usedAny, setUsedAny] = useState(false);

  // 마운트 시 localStorage 에서 used 플래그 + 저장된 AI 응답 텍스트 복구.
  // 이전 세션에서 이미 AI 섹션을 1회 이상 사용했다면 onComplete 도 즉시 호출.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 마이그레이션 가드 — used=true 이지만 response 가 없는 슬롯은 USED 도 클리어.
    // (응답 텍스트 저장 기능 도입 이전에 used 플래그만 저장하던 시기의 잔존 키 처리:
    //  복습 본문이 비어 있는 채로 버튼만 disabled 되는 무용 상태 방지 → 슬롯 재사용 허용)
    unit.ai_extension.forEach((_, i) => {
      try {
        const usedFlag =
          window.localStorage.getItem(USED_KEY(unit.unit_id, i)) === "1";
        const responseText = window.localStorage.getItem(
          RESPONSE_KEY(unit.unit_id, i),
        );
        if (usedFlag && !responseText) {
          window.localStorage.removeItem(USED_KEY(unit.unit_id, i));
        }
      } catch {
        /* localStorage 불가 환경은 무시 */
      }
    });

    const restoredUsed = unit.ai_extension.map((_, i) => {
      try {
        return window.localStorage.getItem(USED_KEY(unit.unit_id, i)) === "1";
      } catch {
        return false;
      }
    });
    const restoredStates: PromptState[] = unit.ai_extension.map((_, i) => {
      try {
        const text = window.localStorage.getItem(RESPONSE_KEY(unit.unit_id, i));
        if (text) return { status: "ok", text };
      } catch {
        /* localStorage 불가 환경은 무시 */
      }
      return { status: "idle", text: "" };
    });
    setUsed(restoredUsed);
    setStates(restoredStates);
    if (restoredUsed.some(Boolean)) {
      setUsedAny(true);
      onComplete();
    }
    // onComplete 는 의존성에서 제외 (상위 re-render 때마다 재호출 방지).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.unit_id, unit.ai_extension.length]);

  const markUsed = (idx: number, responseText?: string) => {
    setUsed((prev) => {
      const copy = [...prev];
      copy[idx] = true;
      return copy;
    });
    try {
      window.localStorage.setItem(USED_KEY(unit.unit_id, idx), "1");
      // 정상 응답만 복습용으로 보존 (에러/빈 응답은 저장하지 않음)
      if (responseText && responseText.trim().length > 0) {
        window.localStorage.setItem(
          RESPONSE_KEY(unit.unit_id, idx),
          responseText,
        );
      }
    } catch {
      /* localStorage 불가 환경은 무시 */
    }
    if (!usedAny) {
      setUsedAny(true);
      onComplete();
    }
  };

  const ask = async (idx: number) => {
    if (used[idx]) return;
    const prompt = unit.ai_extension[idx];
    setStates((prev) => {
      const copy = [...prev];
      copy[idx] = { status: "loading", text: "" };
      return copy;
    });

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          unitTitle: unit.topic,
          language: unit.language,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.content || "(응답을 받아오지 못했습니다)";
      setStates((prev) => {
        const copy = [...prev];
        copy[idx] = { status: "ok", text };
        return copy;
      });
      markUsed(idx, text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setStates((prev) => {
        const copy = [...prev];
        copy[idx] = {
          status: "error",
          text: `오류가 발생했어요: ${msg}`,
        };
        return copy;
      });
      // 에러는 복습용으로 저장하지 않음 — 횟수만 소진 처리
      markUsed(idx);
    }
  };

  // 노출된 AI 확장 프롬프트가 모두 소진됐는지 — 복습 모드 안내용
  const allUsed =
    visibleAI.length > 0 && visibleAI.every((_, i) => used[i]);

  return (
    <div className={styles.aiPrompts}>
      {allUsed && (
        <div
          role="note"
          style={{
            marginBottom: 14,
            background: "rgba(39,211,195,0.08)",
            border: "1px solid rgba(39,211,195,0.3)",
            borderRadius: 14,
            padding: "12px 16px",
            color: "#0f172a",
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          AI 확장을 모두 사용했습니다. 아래에서 학습 내용을 복습할 수 있습니다.
        </div>
      )}
      {visibleAI.map((prompt, i) => {
        const s = states[i];
        const isUsed = used[i];
        const isLoading = s.status === "loading";
        return (
          <div key={i}>
            <button
              type="button"
              className={`${styles.aiPromptBtn} ${
                isUsed ? styles.aiPromptBtnUsed : ""
              }`}
              onClick={() => ask(i)}
              disabled={isUsed || isLoading}
              style={
                isUsed
                  ? {
                      background: "#e2e8f0",
                      color: "#94a3b8",
                      borderColor: "#cbd5e1",
                      cursor: "not-allowed",
                      opacity: 0.85,
                    }
                  : undefined
              }
            >
              💬 {prompt}
              {isUsed && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#64748b",
                  }}
                >
                  · 사용됨
                </span>
              )}
            </button>
            {isLoading && (
              <div className={styles.aiResponse}>
                <div className={styles.aiLoading}>
                  <div className={styles.spinner} />
                  AI가 생각 중이에요...
                </div>
              </div>
            )}
            {s.status === "ok" && (
              <div className={styles.aiResponse}>{s.text}</div>
            )}
            {s.status === "error" && (
              <div
                className={styles.aiResponse}
                style={{ background: "#fee2e2", borderColor: "#fecaca", color: "#b91c1c" }}
              >
                {s.text}
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  .env.local에 ANTHROPIC_API_KEY가 설정되어 있는지 확인해 주세요.
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 작업 4: 계정 상태별 분기 배너
            - trialing  : "체험 중에는 3가지" + "구독 후 Premium 시 5가지" / [구독하기 → /pricing]
            - b2c_active basic : "Basic 에서는 3가지" + "Premium 시 +N개" / [업그레이드 → /pricing?upgrade=premium]
            - b2c_active premium / 그 외 : 배너 X (Premium 은 모든 5개 노출 + hasMoreForPremium=false)
       */}
      {hasMoreForPremium && (() => {
        const isTrial = accountKind === "trialing";
        const title = isTrial
          ? "체험 중에는 3가지 AI 확장 사용 가능"
          : "Basic 플랜에서는 3가지 AI 확장 사용 가능";
        const sub = isTrial
          ? "구독 후 Premium 업그레이드 시 5가지 모두 사용 가능"
          : `Premium 업그레이드 시 +${additionalCount}개 추가 학습`;
        const ctaLabel = isTrial ? "구독하기 →" : "업그레이드 →";
        const ctaHref = isTrial ? "/pricing" : "/pricing?upgrade=premium";

        return (
          <div
            style={{
              marginTop: 16,
              background: "rgba(39,211,195,0.08)",
              border: "1px solid rgba(39,211,195,0.3)",
              borderRadius: 22,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {title}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                {sub}
              </p>
            </div>
            <Link
              href={ctaHref}
              style={{
                flexShrink: 0,
                background: "#122c4f",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {ctaLabel}
            </Link>
          </div>
        );
      })()}
    </div>
  );
}
