import { adminHandlers } from "@/lib/admin-handlers";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminHandlers().updateEvent(request, (await params).id);
}
