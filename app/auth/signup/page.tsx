"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AUTH_DICT, LANG_LABEL, type Lang } from "../_auth-i18n";

export default function SignUpPage() {
  const supabase = createClient();

  const [lang, setLang] = useState<Lang>("ko");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const t = AUTH_DICT[lang];

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (password !== confirm) {
      setError(t.errorMismatch);
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(t.error);
      return;
    }
    setNotice(t.checkEmail);
  }

  async function handleOAuth(provider: "google" | "kakao") {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(t.error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center bg-white px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-6">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white"
            aria-label="Language"
          >
            {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
              <option key={l} value={l}>
                {LANG_LABEL[l]}
              </option>
            ))}
          </select>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">{t.brand}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">{t.signUpTitle}</h2>

        <form onSubmit={handleSignUp} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="email"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder={t.passwordConfirm}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-green-700">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60 active:bg-blue-700"
          >
            {t.submitSignUp}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 border-t border-gray-200" />
          {t.or}
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="w-full h-12 rounded-lg bg-white text-gray-900 font-semibold border border-gray-300 flex items-center justify-center gap-2 disabled:opacity-60 active:bg-gray-50"
          >
            <span aria-hidden="true" className="font-bold">G</span>
            {t.google}
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("kakao")}
            disabled={loading}
            className="w-full h-12 rounded-lg bg-[#FEE500] text-[#191919] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:brightness-95"
          >
            <span aria-hidden="true" className="font-bold">K</span>
            {t.kakao}
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          {t.haveAccount}{" "}
          <a href="/auth" className="text-blue-600 font-medium">
            {t.signIn}
          </a>
        </p>
      </div>
    </main>
  );
}
