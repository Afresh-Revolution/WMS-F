import {
  createEmployeeMeeting,
  listEmployeeMeetings,
} from "@/lib/server/employeeMeetings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return listEmployeeMeetings(request);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return createEmployeeMeeting(request, body);
}
