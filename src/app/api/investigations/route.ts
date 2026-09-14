import { runInvestigation, type AgentProgressEvent } from "@/lib/agent/run-investigation";
import { investigationRequestSchema } from "@/lib/validation/tool-inputs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeEvent(event: AgentProgressEvent) {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = investigationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid investigation request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      void runInvestigation(
        parsed.data.request,
        parsed.data.transactionReference || undefined,
        (event) => controller.enqueue(encodeEvent(event)),
      )
        .catch((error) => {
          console.error("Investigation run failed", error);
        })
        .finally(() => controller.close());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

