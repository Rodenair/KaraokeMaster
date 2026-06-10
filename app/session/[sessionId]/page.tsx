"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import VideoPlayer from "@/components/VideoPlayer";
import QueueList from "@/components/QueueList";
import type { Session } from "@/lib/types";

const POLL_INTERVAL_MS = 7_000;

export default function HostPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    if (res.ok) {
      const data: Session = await res.json();
      setSession(data);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    pollRef.current = setInterval(fetchSession, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchSession]);

  async function handleNext() {
    setActionLoading(true);
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "next" }),
    });
    await fetchSession();
    setActionLoading(false);
  }

  async function handleReset() {
    if (!confirm("Clear the entire queue? This cannot be undone.")) return;
    setActionLoading(true);
    await fetch(`/api/sessions/${sessionId}/reset`, { method: "POST" });
    await fetchSession();
    setActionLoading(false);
  }

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?sessionId=${sessionId}`
      : "";

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl text-slate-400 mb-4">Session not found</p>
          <p className="text-sm text-slate-600 mb-6">
            It may have been cleared after a server restart.
          </p>
          <Link href="/" className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500">
            Start a new session
          </Link>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-purple-700/15 blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="mx-auto max-w-6xl mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">
            ← Modern Karaoke
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-100">
            {session.hostName ? `${session.hostName}'s Session` : "Host Session"}
          </h1>
          <p className="text-xs text-slate-500">
            Session ID: <span className="font-mono text-slate-400">{sessionId}</span>
          </p>
        </div>

        {/* Join link badge */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-[#2d2d4e] bg-[#1a1a2e] px-4 py-2">
            <p className="text-xs text-slate-500 mb-0.5">Join link</p>
            <p className="font-mono text-sm text-purple-300 truncate max-w-[260px]">
              {joinUrl}
            </p>
          </div>
          <Link
            href={`/join?sessionId=${sessionId}`}
            target="_blank"
            className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2.5 text-sm text-purple-300 hover:bg-purple-500/20 transition-colors whitespace-nowrap"
          >
            Join page →
          </Link>
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Player column */}
        <div className="space-y-4">
          <VideoPlayer
            videoId={session.currentVideoId}
            onEnded={handleNext}
          />

          {session.currentVideoId && (
            <div className="rounded-xl border border-[#2d2d4e] bg-[#1a1a2e] px-4 py-3 flex items-center gap-3">
              <img
                src={`https://img.youtube.com/vi/${session.currentVideoId}/mqdefault.jpg`}
                alt=""
                className="h-12 w-[86px] rounded object-cover"
              />
              <div>
                <p className="text-xs text-slate-500">Now playing</p>
                <p className="font-semibold text-slate-100">
                  {session.queue[0]?.title ?? `Video ${session.currentVideoId}`}
                </p>
              </div>
            </div>
          )}

          {/* Polling indicator */}
          <p className="text-xs text-slate-700 text-right">
            Queue refreshes every {POLL_INTERVAL_MS / 1000}s
          </p>
        </div>

        {/* Queue column */}
        <div>
          <QueueList
            queue={session.queue}
            currentVideoId={session.currentVideoId}
            onNext={handleNext}
            onReset={handleReset}
            loading={actionLoading}
          />
        </div>
      </div>
    </main>
  );
}
