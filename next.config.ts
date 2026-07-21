import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.70.44.49'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self' https://*.supabase.co;",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

// Sentry Config
const sentryConfig = {
  org: "medicbot",
  project: "medicbot-web",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
};

// Serwist Config
const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

export default withSentryConfig(withSerwist(nextConfig), sentryConfig);
