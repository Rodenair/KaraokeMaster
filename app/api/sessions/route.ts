import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { sessions } from "@/lib/store";
import type { Session } from "@/lib/types";

export async function POST(req: NextRequest) {
  let hostName: string | undefined;
  try {
    const body = await req.json();
    hostName = typeof body?.hostName === "string" ? body.hostName.slice(0, 64) : undefined;
  } catch {
    // body is optional
  }

  const sessionId = uuidv4();
  const session: Session = {
    sessionId,
    hostName,
    queue: [],
    createdAt: new Date().toISOString(),
  };
  sessions.set(sessionId, session);

  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  const joinUrl = `${origin}/join?sessionId=${sessionId}`;

  return NextResponse.json({ sessionId, joinUrl }, { status: 201 });
}
