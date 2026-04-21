"use client";

import { useState } from "react";
import styles from "../unit.module.css";
import type { UnitData } from "../types";

type PromptState = {
  status: "idle" | "loading" | "ok" | "error";
  text: string;
};

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
  const [usedAny, setUsedAny] = useState(false);

  const ask = async (idx: number) => {
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
        body: JSON.stringify({ prompt, unitTitle: unit.topic }),
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
      if (!usedAny) {
        setUsedAny(true);
        onComplete();
      }
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
      if (!usedAny) {
        setUsedAny(true);
        onComplete();
      }
    }
  };

  return (
    <div className={styles.aiPrompts}>
      {unit.ai_extension.map((prompt, i) => {
        const s = states[i];
        const used = s.status !== "idle";
        return (
          <div key={i}>
            <button
              type="button"
              className={`${styles.aiPromptBtn} ${
                used ? styles.aiPromptBtnUsed : ""
              }`}
              onClick={() => ask(i)}
              disabled={s.status === "loading"}
            >
              💬 {prompt}
            </button>
            {s.status === "loading" && (
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
