const API_ROOT = (
  process.env.NEXT_PUBLIC_API_ROOT_URL ?? "https://wms-b.onrender.com"
).replace(/\/$/, "");

const FORWARD_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "accept-language",
];

const FORWARD_RESPONSE_HEADERS = ["content-type", "content-disposition"];

export async function proxyToBackend(
  request: Request,
  targetPath: string,
): Promise<Response> {
  const incoming = new URL(request.url);
  const targetUrl = `${API_ROOT}${targetPath}${incoming.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

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
  const suffix = pathSegments.length ? `/${pathSegments.join("/")}` : "";
  return proxyToBackend(request, `${prefix}${suffix}`);
}
