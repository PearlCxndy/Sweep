import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  // iCloud duplicates files in .next (CURRENT 3, 00000001 2.sst). Turbopack
  // then fails to parse those names and the dev server dies.
  experimental: { turbopackFileSystemCacheForDev: false },
  agentRules: false,
};

export default nextConfig;
