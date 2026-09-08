import { proxyToBackend } from "@/lib/api/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyToBackend(request, "/health");
}
