"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InviteForm(props: {
  token: string;
  email: string;
  alreadyLoggedIn: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function acceptInvitation(): Promise<void> {
    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: props.token }),
    });
    const raw = await res.text();
    let json: { error?: string; ok?: boolean } = {};
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(`서버 오류 (HTTP ${res.status})`);
    }
    if (!res.ok || !json.ok) {
      throw new Error(json.error ?? `수락 실패 (HTTP ${res.status})`);
    }
  }

  async function onAcceptOnly() {
    setError(null);
    setLoading(true);
    try {
      await acceptInvitation();
      router.replace("/learn");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setLoading(false);
    }
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: props.email,
          password,
        });
      if (signUpError) {
        throw new Error(signUpError.message);
      }
      if (!signUpData.session) {
        // 이메일 확인이 켜져 있는 경우 또는 기존 계정
        setError(
          "이미 가입된 이메일이거나 이메일 확인이 필요합니다. 로그인 후 이 링크를 다시 열어 주세요.",
        );
        setLoading(false);
        return;
      }
      await acceptInvitation();
      router.replace("/learn");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setLoading(false);
    }
  }

  if (props.alreadyLoggedIn) {
    return (
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onAcceptOnly}
          disabled={loading}
          className="h-12 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "처리 중..." : "초대 수락하고 학습 시작하기"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-center text-xs text-gray-500">
          현재 로그인된 {props.email} 계정으로 수락합니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSignUp} className="mt-6 space-y-3">
      <input
        type="email"
        value={props.email}
        readOnly
        className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-base text-gray-700"
        aria-label="초대받은 이메일"
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="비밀번호 (6자 이상)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-12 w-full rounded-lg border border-gray-300 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="new-password"
        disabled={loading}
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="비밀번호 확인"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="h-12 w-full rounded-lg border border-gray-300 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="new-password"
        disabled={loading}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "처리 중..." : "가입하고 학습 시작하기"}
      </button>
    </form>
  );
}
