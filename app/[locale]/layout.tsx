import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { notFound } from "next/navigation";
import { routing } from "@/lib/routing";
import BottomNav from "@/components/BottomNav";
import SessionGuard from "@/components/SessionGuard";
import "../globals.css";

export const metadata: Metadata = {
  title: "PhoneLink Brussels",
  description: "Réseau de boutiques téléphonie à Bruxelles",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PhoneLink" },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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

  // Note: <html> and <body> live in app/layout.tsx (Next.js 15 requirement).
  // We set lang via script to avoid hydration mismatch.
  return (
    <NextIntlClientProvider messages={messages}>
      <SessionGuard authFreePaths={AUTH_FREE_PATHS} locale={locale}>
        <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-gray-50 text-gray-900 antialiased">
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </div>
      </SessionGuard>
      <Toaster richColors position="top-center" />
    </NextIntlClientProvider>
  );
}
