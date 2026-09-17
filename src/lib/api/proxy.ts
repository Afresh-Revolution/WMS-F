const DEFAULT_API_ROOT = "https://wms-b.onrender.com";

const FORWARD_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "accept-language",
];

const FORWARD_RESPONSE_HEADERS = ["content-type", "content-disposition"];

/** The Response constructor rejects a non-null body for these statuses. */
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

/** Server-side backend URL (route handlers). Prefer API_ROOT_URL over NEXT_PUBLIC_*. */
const PROXY_ATTEMPTS = 3;
const PROXY_TIMEOUT_MS = 15_000;

async function fetchBackend(
  targetUrl: string,
  init: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= PROXY_ATTEMPTS; attempt += 1) {
    try {
      return await fetch(targetUrl, {
        ...init,
        signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;
      const detail = error instanceof Error ? error.message : String(error);
      console.error(
        `[api-proxy] attempt ${attempt}/${PROXY_ATTEMPTS} failed:`,
        targetUrl,
        detail,
      );
      if (attempt < PROXY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Backend fetch failed");
}

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
  const requestBody = hasBody ? await request.text() : undefined;
  let response: Response;

  try {
    response = await fetchBackend(targetUrl, {
      method: request.method,
      headers,
      body: requestBody,
      cache: "no-store",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api-proxy] fetch failed:", targetUrl, detail);
    return Response.json(
      {
        error:
          "The backend could not be reached. Wait a few seconds and try again.",
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

  const responseBody = NULL_BODY_STATUSES.has(response.status)
    ? null
    : await response.arrayBuffer();

  return new Response(responseBody, {
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
