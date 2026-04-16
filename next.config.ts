import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  reactStrictMode: false, // Leaflet doesn't support React StrictMode's double-mount in dev
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
};

export default withNextIntl(nextConfig);
