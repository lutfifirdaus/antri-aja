import { adminHandlers } from "@/lib/admin-handlers";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => adminHandlers().createCounter(request);
