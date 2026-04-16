"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { getInviteByToken, acceptInvite } from "@/app/actions/invites";

type InviteData = {
  id: string;
  network_id: string;
  name_hint: string | null;
  expires_at: string;
  accepted_at: string | null;
};

type Language = "fr" | "en" | "nl";

export default function InvitePage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const locale = (params.locale as string) || "fr";

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [commune, setCommune] = useState("");
  const [language, setLanguage] = useState<Language>(locale as Language);

  useEffect(() => {
    getInviteByToken(token).then(({ data, error }) => {
      if (error || !data || data.accepted_at || new Date(data.expires_at) < new Date()) {
        setInvalid(true);
      } else {
        setInvite(data);
        if (data.name_hint) setShopName(data.name_hint);
      }
      setLoading(false);
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopName.trim() || !ownerName.trim()) return;

    setSubmitting(true);
    const { error } = await acceptInvite({
      token,
      shop_name: shopName.trim(),
      owner_name: ownerName.trim(),
      commune: commune.trim() || undefined,
      language_pref: language,
    });
    setSubmitting(false);

    if (error === "invalid_token" || (error as string) === "invalid_token") {
      toast.error(t("invite.invalid_token"));
      return;
    }
    if (error) {
      toast.error(t("errors.unknown"));
      return;
    }

    toast.success(t("invite.success"));
    router.replace(`/${language}/demandes`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t("invite.invalid_token")}</h1>
        <p className="text-sm text-gray-500">{t("errors.not_found")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand text-white text-xl font-bold mb-3 shadow-md">
            PL
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t("invite.title")}</h1>
          {invite?.name_hint && (
            <p className="mt-1 text-sm text-gray-500">
              {t("invite.invited_by", { name: invite.name_hint })}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("invite.shop_name_label")} *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("invite.owner_name_label")} *
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("invite.commune_label")}
              </label>
              <input
                type="text"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("invite.language_label")}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand bg-white"
                disabled={submitting}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="nl">Nederlands</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !shopName.trim() || !ownerName.trim()}
              className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-base hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? t("invite.joining") : t("invite.join")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
