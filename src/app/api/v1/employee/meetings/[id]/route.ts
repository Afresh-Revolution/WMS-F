import {
  getEmployeeMeeting,
  updateEmployeeMeeting,
} from "@/lib/server/employeeMeetings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return getEmployeeMeeting(request, id);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return updateEmployeeMeeting(request, id, body);
}
