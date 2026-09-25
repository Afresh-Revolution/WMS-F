import {
  createEmployeeAnnouncement,
  listEmployeeAnnouncements,
} from "@/lib/server/employeeAnnouncements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return listEmployeeAnnouncements(request);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return createEmployeeAnnouncement(request, body);
}
