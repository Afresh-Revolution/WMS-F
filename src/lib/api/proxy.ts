const DEFAULT_API_ROOT = "https://wms-b.onrender.com";

const FORWARD_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "accept-language",
];

const FORWARD_RESPONSE_HEADERS = ["content-type", "content-disposition"];

/** Server-side backend URL (route handlers). Prefer API_ROOT_URL over NEXT_PUBLIC_*. */
export function resolveApiRoot(): string {
  const candidates = [
    process.env.API_ROOT_URL,
    process.env.NEXT_PUBLIC_API_ROOT_URL,
    DEFAULT_API_ROOT,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed.replace(/\/$/, "");
    }
  }

  return DEFAULT_API_ROOT;
}

export async function proxyToBackend(
  request: Request,
  targetPath: string,
): Promise<Response> {
  const apiRoot = resolveApiRoot();
  const incoming = new URL(request.url);
  const targetUrl = `${apiRoot}${targetPath}${incoming.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let response: Response;

  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api-proxy] fetch failed:", targetUrl, detail);
    return Response.json(
      {
        error: "Unable to reach the backend API.",
        detail,
        target: targetUrl,
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function proxyRouteHandler(
  request: Request,
  pathSegments: string[],
  prefix: string,
) {
  try {
    const suffix = pathSegments.length ? `/${pathSegments.join("/")}` : "";
    return await proxyToBackend(request, `${prefix}${suffix}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api-proxy] route handler failed:", prefix, detail);
    return Response.json(
      { error: "API proxy failed.", detail },
      { status: 500 },
    );
  }
}
