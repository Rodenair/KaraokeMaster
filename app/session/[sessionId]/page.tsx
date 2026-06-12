"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import VideoPlayer from "@/components/VideoPlayer";
import QueueList from "@/components/QueueList";
import type { Session } from "@/lib/types";

const VideoSearchForm = dynamic(() => import("@/components/VideoSearchForm"), { ssr: false });

const POLL_INTERVAL_MS = 7_000;

export default function HostPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddSong, setShowAddSong] = useState(false);
  const [playerFullscreen, setPlayerFullscreen] = useState(false);
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
          <div className="text-5xl mb-4">😢</div>
          <p className="text-xl font-bold text-[#d0a0ff] mb-2">Session not found</p>
          <p className="text-sm text-[#5a3070] mb-6">It may have been cleared after a server restart.</p>
          <Link href="/" className="btn-gold rounded-xl px-6 py-3 text-sm uppercase shadow-lg">
            Start a New Session
          </Link>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse-slow">🎤</div>
          <div className="h-1 w-32 mx-auto rounded-full overflow-hidden bg-[#2a0040]">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#ff0080] via-[#ffd700] to-[#00d4ff] animate-marquee" />
          </div>
        </div>
      </main>
    );
  }

  const nowPlayingTitle =
    session.queue[0]?.title ?? (session.currentVideoId ? `Video ${session.currentVideoId}` : null);

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Stage lighting ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#ff0080]/15 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#00d4ff]/10 blur-[130px]" />
        <div className="absolute top-1/2 left-0 h-[300px] w-[300px] rounded-full bg-[#ffd700]/8 blur-[110px]" />
      </div>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 backdrop-blur-sm"
        style={{
          background: "linear-gradient(180deg, rgba(7,0,15,0.97) 0%, rgba(15,0,24,0.92) 100%)",
          backgroundClip: "padding-box",
          boxShadow: "0 1px 0 0 rgba(255,0,128,0.3)",
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Link
              href="/"
              className="font-display text-xs font-bold uppercase tracking-widest text-[#ff0080] hover:text-[#ffd700] transition-colors"
            >
              🎤 Videoke!
            </Link>
            <h1 className="font-display text-base font-bold text-white truncate leading-tight">
              {session.hostName ? `${session.hostName}'s Session` : "Host Session"}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={copyJoinUrl}
              className="min-h-[40px] rounded-lg border border-[#3a004a] bg-[#0f0018] px-3 py-2 text-sm text-[#d0a0ff] hover:border-[#ff0080] hover:text-[#ff0080] transition-all"
            >
              {copied ? "Copied! ✓" : "Copy link"}
            </button>
            <Link
              href={`/join?sessionId=${sessionId}`}
              target="_blank"
              className="btn-pink min-h-[40px] flex items-center rounded-lg px-3 py-2 text-sm uppercase tracking-wide shadow-lg shadow-pink-900/40"
            >
              QR / Join
            </Link>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
        <div className="flex flex-col md:grid md:grid-cols-[1fr_360px] gap-4 md:gap-6">

          {/* Player column */}
          <div className="flex flex-col gap-3">
            {/* Spacer: holds the layout space occupied by the fixed player on mobile */}
            <div className="pb-[56.25vw] md:hidden" aria-hidden="true" />

            {/* Player: fixed below the header on mobile so it never scrolls away;
                z-index is boosted above the header (z-20) when fullscreen is active */}
            <div className={`fixed top-16 left-0 right-0 md:static ${playerFullscreen ? "z-[150]" : "z-10"}`}>
              <VideoPlayer
                videoId={session.currentVideoId}
                onEnded={handleNext}
                title={nowPlayingTitle ?? undefined}
                onFullscreenChange={setPlayerFullscreen}
              />
            </div>

            {/* Now Playing bar */}
            {nowPlayingTitle ? (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: "linear-gradient(135deg, rgba(255,0,128,0.15), rgba(191,0,255,0.15))",
                  border: "1.5px solid rgba(255,0,128,0.4)",
                }}
              >
                {session.currentVideoId && (
                  <img
                    src={`https://img.youtube.com/vi/${session.currentVideoId}/mqdefault.jpg`}
                    alt=""
                    className="h-10 w-[72px] flex-shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#ff0080]">
                    ▶ Now Playing
                  </p>
                  <p className="truncate font-display font-bold text-white">{nowPlayingTitle}</p>
                </div>
                <span className="text-xl animate-pulse-slow">🎵</span>
              </div>
            ) : (
              <div className="rounded-xl border border-[#2a0040] bg-[#0f0018] px-4 py-3 text-center text-sm text-[#5a3070]">
                Queue is empty — add a song below or share the join link!
              </div>
            )}

            <p className="text-right text-xs text-[#3a1050]">
              Auto-refreshes every {POLL_INTERVAL_MS / 1000}s
            </p>
          </div>

          {/* Queue + Add Song column */}
          <div className="flex flex-col gap-3">
            <QueueList
              queue={session.queue}
              currentVideoId={session.currentVideoId}
              onNext={handleNext}
              onReset={handleReset}
              loading={actionLoading}
            />

            {/* ── Add Song panel ── */}
            <div className="overflow-hidden rounded-xl" style={{ border: "1.5px solid #3a004a", background: "#0f0018" }}>
              <button
                onClick={() => setShowAddSong((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
              >
                <span className="font-display font-bold text-white flex items-center gap-2">
                  <span
                    className="rounded-lg px-2 py-0.5 text-xs font-extrabold uppercase tracking-widest text-black"
                    style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00)" }}
                  >
                    + Add
                  </span>
                  Add a Song
                </span>
                <span className="text-[#ff0080] text-lg select-none">
                  {showAddSong ? "▲" : "▼"}
                </span>
              </button>

              {showAddSong && (
                <div
                  className="px-4 pb-4"
                  style={{ borderTop: "1.5px solid #2a0040" }}
                >
                  <div className="pt-4">
                    <VideoSearchForm
                      sessionId={sessionId}
                      onAdded={() => {
                        fetchSession();
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
