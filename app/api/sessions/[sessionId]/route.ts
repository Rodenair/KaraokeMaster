import { NextRequest, NextResponse } from "next/server";
import { sessions } from "@/lib/store";

interface Params {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

// Used by the host to advance the queue (set currentVideoId and dequeue first item)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action === "next") {
    if (session.queue.length > 0) {
      session.queue.shift();
    }
    session.currentVideoId = session.queue[0]?.videoId ?? undefined;
  }

  return NextResponse.json(session);
}
