import { readEmployeeDocumentFile } from "@/lib/server/employeeDocuments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const download = new URL(request.url).searchParams.get("download") === "1";
  return readEmployeeDocumentFile(request, id, download);
}
