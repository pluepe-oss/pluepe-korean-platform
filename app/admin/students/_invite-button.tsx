"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function reset() {
    setEmail("");
    setError(null);
    setNotice(null);
    setLoading(false);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const raw = await res.text();
      let json: { error?: string; ok?: boolean } = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`서버 오류 (HTTP ${res.status})`);
      }
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? `초대 실패 (HTTP ${res.status})`);
      }
      setNotice(`${email}으로 초대 메일을 보냈어요.`);
      setEmail("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white active:bg-blue-700"
      >
        + 학생 초대
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="invite-title" className="text-lg font-semibold text-gray-900">
              학생 초대
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              초대 메일이 발송되며, 7일 이내에 수락해야 합니다.
            </p>

            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-600">
                  이메일
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="email"
                  disabled={loading}
                />
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {notice && <p className="text-sm text-emerald-700">{notice}</p>}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={loading}
                  className="h-11 flex-1 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 active:bg-gray-50 disabled:opacity-60"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 flex-1 rounded-lg bg-blue-600 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "보내는 중..." : "초대 메일 보내기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
