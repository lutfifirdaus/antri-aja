import { adminHandlers } from "@/lib/admin-handlers";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminHandlers().issueGatePin(request, (await params).id);
}
