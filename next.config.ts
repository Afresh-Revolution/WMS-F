import type { NextConfig } from "next";

/**
 * API traffic is proxied by App Router route handlers under
 * src/app/api/* and src/app/health/* (server-side, no browser Origin).
 */
const nextConfig: NextConfig = {};

export default nextConfig;
