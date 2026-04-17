"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "email" | "otp";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "fr";
  const supabase = getSupabaseBrowserClient();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error(t("auth.invalid_email"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? t("errors.network"));
      return;
    }
    toast.success(t("auth.otp_sent", { contact: email.trim() }));
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error(t("auth.invalid_otp"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: "email",
    });
    setLoading(false);
    if (error) {
      toast.error(t("auth.invalid_otp"));
      return;
    }
    router.replace(`/${locale}/demandes`);
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative bg-brand-500">

      {/* ── Video background ───────────────────────────────────────── */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="https://images.pexels.com/photos/5673502/pexels-photo-5673502.jpeg?auto=compress&cs=tinysrgb&w=1280"
      >
        {/* Woman browsing a phone store (Mixkit 11658, free license) */}
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay — bottom heavy for card legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-brand-500/60 to-brand-500/30" />

      {/* ── Foreground content ─────────────────────────────────────── */}

      {/* Home button — top right */}
      <div className="relative flex justify-end px-5 pt-5">
        <a
          href="/"
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg hover:bg-white/30 transition-colors"
          aria-label="Home"
        >
          <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
            <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7A1 1 0 0 0 3 11h1v6a1 1 0 0 0 1 1h4v-4h2v4h4a1 1 0 0 0 1-1v-6h1a1 1 0 0 0 .707-1.707l-7-7Z" />
          </svg>
        </a>
      </div>

      {/* Hero brand — centered */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-4">
        {/* Logo mark */}
        <div className="flex flex-col items-center">

          {/* New logo: circular badge with stylised phone + signal arcs */}
          <div className="w-[100px] h-[100px] rounded-[28px] bg-white/95 backdrop-blur flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.45)] mb-6">
            <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14" aria-hidden="true">
              {/* Phone handset body */}
              <rect x="14" y="8" width="20" height="32" rx="4" fill="#1e3a5f"/>
              <rect x="17" y="12" width="14" height="20" rx="2" fill="#e8f0fe"/>
              <circle cx="24" cy="35" r="2" fill="#ffffff"/>
              {/* Signal / link arcs — orange */}
              <path d="M38 20 Q44 20 44 28 Q44 36 38 36" stroke="#e67e22" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
              <path d="M38 24 Q41 24 41 28 Q41 32 38 32" stroke="#e67e22" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
            </svg>
          </div>

          {/* PhoneLink Brussels — Changos, large */}
          <h1
            className="text-[52px] text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-center"
            style={{ fontFamily: "'Changos', cursive" }}
          >
            PhoneLink
          </h1>
          <p
            className="text-[22px] text-white/90 mt-1 drop-shadow text-center"
            style={{ fontFamily: "'Changos', cursive" }}
          >
            Brussels
          </p>
        </div>
      </div>

      </div>

      {/* Bottom login card — slides up from bottom */}
      <div className="relative bg-white rounded-t-[28px] px-6 pt-8 pb-10 shadow-[0_-4px_40px_rgba(0,0,0,0.3)]">
        {/* Pull handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-200" />

        {step === "email" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {t("auth.title")}
              </h2>
              <p className="text-sm text-gray-500 mb-5">{t("auth.subtitle")}</p>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t("auth.email_label")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email_placeholder")}
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-shadow"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-semibold text-base hover:bg-brand-700 disabled:opacity-40 transition-all duration-150 shadow-[0_4px_12px_rgba(30,58,95,0.3)] hover:shadow-[0_6px_16px_rgba(30,58,95,0.4)] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("auth.sending")}
                </span>
              ) : (
                t("auth.send_otp")
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); }}
              className="flex items-center gap-1.5 text-sm text-brand-500 font-medium hover:text-brand-700 mb-1 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
              {t("auth.back")}
            </button>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {t("auth.otp_label")}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {t("auth.otp_sent", { contact: email })}
              </p>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="00000000"
                autoComplete="one-time-code"
                className="w-full px-4 py-4 rounded-xl border border-gray-200 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-shadow"
                disabled={loading}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-semibold text-base hover:bg-brand-700 disabled:opacity-40 transition-all duration-150 shadow-[0_4px_12px_rgba(30,58,95,0.3)] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("auth.verifying")}
                </span>
              ) : (
                t("auth.verify")
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
