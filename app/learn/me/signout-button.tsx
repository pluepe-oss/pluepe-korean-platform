"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  async function signOut() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/auth");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그아웃에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-red-600 text-sm font-semibold text-white active:bg-red-700 disabled:opacity-60"
      >
        {loading ? "로그아웃 중..." : "로그아웃"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {showConfirm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-confirm-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3
              id="signout-confirm-title"
              className="text-lg font-semibold text-gray-900"
            >
              로그아웃 하시겠어요?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              다시 학습하려면 로그인해야 해요.
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
                  signOut();
                }}
                disabled={loading}
                className="h-11 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white active:bg-red-700 disabled:opacity-60"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
