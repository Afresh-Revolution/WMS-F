import { downloadEmployeeDocument } from "@/lib/server/employeeDocuments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return downloadEmployeeDocument(request, id);
}
