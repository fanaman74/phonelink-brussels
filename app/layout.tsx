import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Root layout — Next.js 15 requires <html> and <body> here.
// The [locale] layout provides the full shell with lang attribute and providers.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
