import {
  createEmployeeDocument,
  listEmployeeDocuments,
} from "@/lib/server/employeeDocuments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return listEmployeeDocuments(request);
}

export async function POST(request: Request) {
  return createEmployeeDocument(request);
}
