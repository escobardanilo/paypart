import { getDatabaseReadDiagnostics } from "@/lib/database/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks = await getDatabaseReadDiagnostics();
  const success = checks.every((check) => check.success);

  return Response.json(checks, {
    status: success ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
