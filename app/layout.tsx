// Root layout — Next.js 15 requires <html> and <body> here.
// The [locale] layout provides the full shell with lang attribute and providers.
// suppressHydrationWarning prevents false hydration mismatch from nested html/body.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
