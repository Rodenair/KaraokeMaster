import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { sessions, checkRateLimit } from "@/lib/store";
import { extractVideoId } from "@/lib/youtube";
import type { QueueItem } from "@/lib/types";

interface Params {
  params: Promise<{ sessionId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { sessionId } = await params;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 }
    );
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { videoId?: string; title?: string; duration?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawVideoId = typeof body?.videoId === "string" ? body.videoId : "";
  const videoId = extractVideoId(rawVideoId);
  if (!videoId) {
    return NextResponse.json(
      { error: "Invalid YouTube videoId or URL" },
      { status: 422 }
    );
  }

  const title =
    typeof body?.title === "string" ? body.title.slice(0, 200) : undefined;
  const duration =
    typeof body?.duration === "number" && body.duration > 0
      ? body.duration
      : undefined;

  const item: QueueItem = {
    id: uuidv4(),
    videoId,
    title,
    duration,
    addedAt: new Date().toISOString(),
  };

  session.queue.push(item);

  // Auto-set currentVideoId if this is the first item
  if (!session.currentVideoId) {
    session.currentVideoId = videoId;
  }

  return NextResponse.json({ success: true, item, queue: session.queue }, { status: 201 });
}
