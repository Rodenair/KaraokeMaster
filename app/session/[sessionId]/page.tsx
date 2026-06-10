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
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.status === 404) { setNotFound(true); return; }
    if (res.ok) setSession(await res.json());
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    pollRef.current = setInterval(fetchSession, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchSession]);

  const handleNext = useCallback(async () => {
    setActionLoading(true);
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "next" }),
    });
    await fetchSession();
    setActionLoading(false);
  }, [sessionId, fetchSession]);

  const handleReset = useCallback(async () => {
    if (!confirm("Clear the entire queue? This cannot be undone.")) return;
    setActionLoading(true);
    await fetch(`/api/sessions/${sessionId}/reset`, { method: "POST" });
    await fetchSession();
    setActionLoading(false);
  }, [sessionId, fetchSession]);

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?sessionId=${sessionId}`
      : "";

  function copyJoinUrl() {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl text-slate-400 mb-4">Session not found</p>
          <p className="text-sm text-slate-600 mb-6">
            It may have been cleared after a server restart.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500"
          >
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

  const nowPlayingTitle = session.queue[0]?.title ?? (session.currentVideoId ? `Video ${session.currentVideoId}` : null);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-purple-700/15 blur-[120px]" />
      </div>

      {/* ── Top nav ── */}
      <header className="sticky top-0 z-20 border-b border-[#2d2d4e] bg-[#0f0f1a]/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 px-4 py-3">
          {/* Left: title */}
          <div className="min-w-0">
            <Link href="/" className="text-xs text-slate-500 hover:text-purple-400 transition-colors">
              ← Modern Karaoke
            </Link>
            <h1 className="text-base font-bold text-slate-100 truncate leading-tight">
              {session.hostName ? `${session.hostName}'s Session` : "Host Session"}
            </h1>
          </div>

          {/* Right: share controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={copyJoinUrl}
              className="min-h-[40px] rounded-lg border border-[#2d2d4e] bg-[#1a1a2e] px-3 py-2 text-sm text-slate-300 hover:border-purple-500/60 hover:text-purple-300 transition-all"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <Link
              href={`/join?sessionId=${sessionId}`}
              target="_blank"
              className="min-h-[40px] flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-sm font-semibold text-white hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              QR / Join
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
        <div className="flex flex-col md:grid md:grid-cols-[1fr_360px] gap-4 md:gap-6">

          {/* Player column */}
          <div className="flex flex-col gap-3">
            <VideoPlayer videoId={session.currentVideoId} onEnded={handleNext} />

            {/* Now playing bar */}
            {nowPlayingTitle && (
              <div className="flex items-center gap-3 rounded-xl border border-[#2d2d4e] bg-[#1a1a2e] px-4 py-3">
                {session.currentVideoId && (
                  <img
                    src={`https://img.youtube.com/vi/${session.currentVideoId}/mqdefault.jpg`}
                    alt=""
                    className="h-10 w-[72px] flex-shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Now playing</p>
                  <p className="truncate font-semibold text-slate-100">{nowPlayingTitle}</p>
                </div>
              </div>
            )}

            <p className="text-right text-xs text-slate-700">
              Auto-refreshes every {POLL_INTERVAL_MS / 1000}s
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
      </div>
    </main>
  );
}
