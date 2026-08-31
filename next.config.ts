import type { NextConfig } from "next";

<<<<<<< HEAD
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
=======
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
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
      },
    ];
  },
};

export default nextConfig;
