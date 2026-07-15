import { NextResponse } from "next/server";
import ZKLib from "zkteco-js";

const ZKTECO_IP = process.env.ZKTECO_IP || "192.168.40.13";
const ZKTECO_PORT = parseInt(process.env.ZKTECO_PORT || "4370");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const zk = new ZKLib(ZKTECO_IP, ZKTECO_PORT, 10000, 5200);

      function send(data: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      }

      function close() {
        try { controller.close(); } catch {}
        zk.disconnect().catch(() => {});
      }

      try {
        await zk.createSocket();
        send({ type: "connected" });

        await zk.getRealTimeLogs((log: unknown) => {
          if (log && typeof log === "object") {
            send({ type: "punch", log });
          }
        });
      } catch (err) {
        send({ type: "error", message: String(err) });
        close();
      }

      // Close after 90s — client will reconnect (SSE auto-reconnects)
      setTimeout(() => close(), 90_000);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
