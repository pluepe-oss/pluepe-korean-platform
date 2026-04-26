"use client";

import { useState } from "react";

export default function PortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  async function openPortal() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const raw = await res.text();
      let json: { url?: string; error?: string } = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`서버가 JSON이 아닌 응답을 반환했습니다 (HTTP ${res.status}).`);
      }
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? `포털을 열 수 없습니다 (HTTP ${res.status}).`);
      }
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="w-full rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-800 active:bg-gray-50 disabled:opacity-60"
      >
        {loading ? "연결 중..." : "구독 관리 · 해지 · 결제수단 변경"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {showConfirm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="portal-confirm-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3
              id="portal-confirm-title"
              className="text-lg font-semibold text-gray-900"
            >
              정말 해지하시겠어요?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              이어지는 Stripe 보안 페이지에서 해지 · 결제수단 변경 · 청구 내역 조회를
              할 수 있어요.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="h-11 flex-1 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 active:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  openPortal();
                }}
                disabled={loading}
                className="h-11 flex-1 rounded-lg bg-gray-900 text-sm font-semibold text-white active:bg-gray-800 disabled:opacity-60"
              >
                이동하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
