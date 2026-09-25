import {
  createReimbursementClaim,
  listReimbursementClaims,
} from "@/lib/server/reimbursementClaims";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return listReimbursementClaims(request);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return createReimbursementClaim(request, body);
}
