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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand text-white text-2xl font-bold mb-4 shadow-md">
            PL
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("auth.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("auth.subtitle")}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === "email" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.email_label")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email_placeholder")}
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-base hover:bg-brand/90 disabled:opacity-50 transition-colors"
              >
                {loading ? t("auth.sending") : t("auth.send_otp")}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                ← {t("auth.back")}
              </button>
              <p className="text-sm text-gray-500 text-center">
                {t("auth.otp_sent", { contact: email })}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.otp_label")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("auth.otp_placeholder")}
                  autoComplete="one-time-code"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-base hover:bg-brand/90 disabled:opacity-50 transition-colors"
              >
                {loading ? t("auth.verifying") : t("auth.verify")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
