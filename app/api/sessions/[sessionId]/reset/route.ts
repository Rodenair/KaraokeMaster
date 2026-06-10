import { NextRequest, NextResponse } from "next/server";
import { sessions } from "@/lib/store";

interface Params {
  params: Promise<{ sessionId: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  session.queue = [];
  session.currentVideoId = undefined;

  return NextResponse.json({ success: true });
}
