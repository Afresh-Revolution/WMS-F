import type { NextConfig } from "next";

const apiRoot = process.env.NEXT_PUBLIC_API_ROOT_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiRoot}/api/v1/:path*`,
      },
      {
        source: "/api/admin/:path*",
        destination: `${apiRoot}/api/admin/:path*`,
      },
      {
        source: "/api/superadmin/:path*",
        destination: `${apiRoot}/api/superadmin/:path*`,
      },
      {
        source: "/health/:path*",
        destination: `${apiRoot}/health/:path*`,
      },
      {
        source: "/health",
        destination: `${apiRoot}/health`,
      },
    ];
  },
};

export default nextConfig;
