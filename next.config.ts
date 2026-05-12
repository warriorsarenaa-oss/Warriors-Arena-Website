import type { NextConfig } from "next";
import "./src/lib/env";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'muctbmjyuoebyfeikoxz.supabase.co',
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["@sparticuz/chromium"],
};

export default withNextIntl(nextConfig);
