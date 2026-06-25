import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: true, // Disabled for now — enable in production with `next build`
});

const nextConfig: NextConfig = {
  turbopack: {}, // Silence Turbopack/webpack conflict warning
};

module.exports = withPWA(nextConfig);

