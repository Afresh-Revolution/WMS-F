import type { NextConfig } from "next";

const apiOrigin = process.env.API_ORIGIN?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_PROXY: apiOrigin ? "1" : "",
  },
  async rewrites() {
    if (!apiOrigin) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
