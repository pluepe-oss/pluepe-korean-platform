"use client";

import { useEffect, useState } from "react";
import styles from "../unit.module.css";
import type { UnitData } from "../types";

type PromptState = {
  status: "idle" | "loading" | "ok" | "error";
  text: string;
};

const USED_KEY = (unitId: string, idx: number) =>
  `pluepe_ai_used_${unitId}_${idx}`;

export default function AISection({
  unit,
  onComplete,
}: {
  unit: UnitData;
  onComplete: () => void;
}) {
  const [states, setStates] = useState<PromptState[]>(() =>
    unit.ai_extension.map(() => ({ status: "idle", text: "" })),
  );
  // 각 버튼의 "이미 사용됨" 플래그. localStorage 와 1:1 동기화.
  const [used, setUsed] = useState<boolean[]>(() =>
    unit.ai_extension.map(() => false),
  );
  const [usedAny, setUsedAny] = useState(false);

  // 마운트 시 localStorage 에서 used 상태 복구.
  // 이전 세션에서 이미 AI 섹션을 1회 이상 사용했다면 onComplete 도 즉시 호출.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const restored = unit.ai_extension.map((_, i) => {
      try {
        return window.localStorage.getItem(USED_KEY(unit.unit_id, i)) === "1";
      } catch {
        return false;
      }
    });
    setUsed(restored);
    if (restored.some(Boolean)) {
      setUsedAny(true);
      onComplete();
    }
    // onComplete 는 의존성에서 제외 (상위 re-render 때마다 재호출 방지).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.unit_id, unit.ai_extension.length]);

  const markUsed = (idx: number) => {
    setUsed((prev) => {
      const copy = [...prev];
      copy[idx] = true;
      return copy;
    });
    try {
      window.localStorage.setItem(USED_KEY(unit.unit_id, idx), "1");
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
      markUsed(idx);
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
      markUsed(idx);
    }
  };

  return (
    <div className={styles.aiPrompts}>
      {unit.ai_extension.map((prompt, i) => {
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
    </div>
  );
}
