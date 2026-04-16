import { Readex_Pro } from "next/font/google";

const readexPro = Readex_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-readex",
});

// Root layout — Next.js 15 requires <html> and <body> here.
// Readex Pro: multilingual-optimized font, excellent for FR/EN/NL (Brussels market).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={readexPro.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
