import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { notFound } from "next/navigation";
import { routing } from "@/lib/routing";
import BottomNav from "@/components/BottomNav";
import SessionGuard from "@/components/SessionGuard";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import "../globals.css";

export const metadata: Metadata = {
  title: "PhoneLink Brussels",
  description: "Réseau de boutiques téléphonie à Bruxelles",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PhoneLink" },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
};

const AUTH_FREE_PATHS = ["/login", "/invite"];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "fr" | "en" | "nl")) {
    notFound();
  }

  const messages = await getMessages();

  // Fetch open request count for the nav badge
  let openRequestCount = 0;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const svc = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      const { data: shopRow } = await svc
        .from("shops")
        .select("network_id")
        .eq("user_id", user.id)
        .single();
      if (shopRow?.network_id) {
        const { count } = await svc
          .from("requests")
          .select("id", { count: "exact", head: true })
          .eq("network_id", shopRow.network_id)
          .eq("status", "open");
        openRequestCount = count ?? 0;
      }
    }
  } catch { /* not logged in — ignore */ }

  return (
    <NextIntlClientProvider messages={messages}>
      <SessionGuard authFreePaths={AUTH_FREE_PATHS} locale={locale}>
        <div className="flex flex-col min-h-screen bg-[#f9f9f7] text-gray-900 antialiased">
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav openRequestCount={openRequestCount} />
        </div>
      </SessionGuard>
      <Toaster richColors position="top-center" />
    </NextIntlClientProvider>
  );
}
