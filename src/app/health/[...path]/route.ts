import { proxyRouteHandler } from "@/lib/api/proxy";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRouteHandler(request, path, "/health");
}

export const GET = handle;
export const POST = handle;
