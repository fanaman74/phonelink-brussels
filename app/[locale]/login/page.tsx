"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "email" | "otp";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
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
      toast.error(t("errors.network"));
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
    router.replace("/fr/demandes");
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-500 overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Top brand section */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-[72px] h-[72px] rounded-[20px] bg-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.25)] mb-5">
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
              <rect x="8" y="4" width="16" height="26" rx="3" fill="#1e3a5f" />
              <rect x="11" y="7" width="10" height="16" rx="1.5" fill="#ffffff" />
              <circle cx="16" cy="27" r="1.5" fill="#ffffff" />
              <path d="M27 14h4M27 18h4M27 22h4" stroke="#e67e22" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            PhoneLink
          </h1>
          <p className="text-brand-200 text-sm font-medium mt-1">Brussels Network</p>
        </div>

        {/* Value props */}
        <div className="flex flex-col gap-3 w-full max-w-[280px] mb-10">
          {[
            { icon: "⚡", text: t("auth.value_1") },
            { icon: "🔗", text: t("auth.value_2") },
            { icon: "📊", text: t("auth.value_3") },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-white/80">
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom login card — slides up from bottom */}
      <div className="relative bg-white rounded-t-[28px] px-6 pt-8 pb-10 shadow-[0_-4px_32px_rgba(0,0,0,0.18)]">
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
