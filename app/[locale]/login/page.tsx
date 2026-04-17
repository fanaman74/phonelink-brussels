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
    if (otp.length < 4) {
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

      {/* Top brand section */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-4 pb-8">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-[84px] h-[84px] rounded-[24px] bg-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.35)] mb-5">
            <svg viewBox="0 0 40 40" fill="none" className="w-11 h-11" aria-hidden="true">
              <rect x="8" y="4" width="16" height="26" rx="3" fill="#1e3a5f" />
              <rect x="11" y="7" width="10" height="16" rx="1.5" fill="#ffffff" />
              <circle cx="16" cy="27" r="1.5" fill="#ffffff" />
              <path d="M27 14h4M27 18h4M27 22h4" stroke="#e67e22" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1
            className="text-[42px] text-white leading-tight drop-shadow-lg"
            style={{ fontFamily: "'Changos', cursive" }}
          >
            PhoneLink
          </h1>
          <p className="text-white/70 text-sm font-medium mt-1 tracking-wide uppercase">Brussels Network</p>
        </div>

        {/* Value props */}
        <div className="flex flex-col gap-3 w-full max-w-[280px] mb-10">
          {[
            { icon: "⚡", text: t("auth.value_1") },
            { icon: "🔗", text: t("auth.value_2") },
            { icon: "📊", text: t("auth.value_3") },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-white/80 drop-shadow">
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
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
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoComplete="one-time-code"
                className="w-full px-4 py-4 rounded-xl border border-gray-200 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-shadow"
                disabled={loading}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 4}
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
