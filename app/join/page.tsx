"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { QueueItem } from "@/lib/types";

const QRCodeDisplay = dynamic(() => import("@/components/QRCodeDisplay"), { ssr: false });
const VideoSearchForm = dynamic(() => import("@/components/VideoSearchForm"), { ssr: false });

function JoinPageInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const [addedCount, setAddedCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Queue panel
  const [showQueue, setShowQueue] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | undefined>();
  const [queueLoading, setQueueLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchQueue() {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      setQueueItems(data.queue ?? []);
      setCurrentVideoId(data.currentVideoId);
    } catch { /* ignore network errors */ }
  }

  useEffect(() => {
    if (!showQueue) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    setQueueLoading(true);
    fetchQueue().finally(() => setQueueLoading(false));
    pollRef.current = setInterval(fetchQueue, 7000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQueue]);

  if (!sessionId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🤔</div>
          <p className="text-[#d0a0ff] mb-4">No session ID provided.</p>
          <Link href="/" className="btn-gold rounded-xl px-5 py-3 text-sm uppercase shadow-lg">
            Go home
          </Link>
        </div>
      </main>
    );
  }

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?sessionId=${sessionId}`
      : `https://example.com/join?sessionId=${sessionId}`;

  function copyUrl() {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      {/* ── Stage lighting ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 right-0 h-[450px] w-[450px] rounded-full bg-[#ff0080]/18 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[#00d4ff]/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#bf00ff]/10 blur-[150px]" />
      </div>

      <div className="mx-auto w-full max-w-sm">
        {/* ── Header ── */}
        <div className="mb-6 text-center select-none">
          <Link
            href="/"
            className="font-display text-xs font-bold uppercase tracking-widest text-[#ff0080] hover:text-[#ffd700] transition-colors"
          >
            🎤 Videoke!
          </Link>

          <div className="mt-3 flex justify-center gap-2 text-lg">
            {["🌟", "🎵", "🎤", "🎵", "🌟"].map((e, i) => (
              <span
                key={i}
                className="animate-twinkle"
                style={{ animationDelay: `${i * 0.35}s` }}
              >
                {e}
              </span>
            ))}
          </div>

          <h1
            className="font-display mt-2 text-4xl font-extrabold uppercase tracking-wide"
            style={{
              background: "linear-gradient(90deg,#ffd700,#ff8c00,#ff0080)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Add a Song!
          </h1>
          <p className="mt-1 text-sm text-[#9060b0]">
            Search and tap to add to the queue.
          </p>
        </div>

        {/* ── Search card ── */}
        <div className="neon-card p-4 sm:p-5 mb-4 shadow-2xl">
          <h2 className="font-display mb-4 text-base font-bold text-white flex items-center gap-2">
            <span
              className="inline-block rounded-lg px-2 py-0.5 text-xs font-extrabold uppercase tracking-widest text-black"
              style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00)" }}
            >
              Search
            </span>
            {addedCount > 0 && (
              <span className="text-sm font-normal text-[#00ff88]">
                {addedCount} song{addedCount > 1 ? "s" : ""} added ✓
              </span>
            )}
          </h2>
          <VideoSearchForm
            sessionId={sessionId}
            onAdded={() => setAddedCount((n) => n + 1)}
          />
        </div>

        {/* ── Queue ── */}
        <div className="mb-4 overflow-hidden rounded-xl" style={{ border: "1.5px solid #3a004a", background: "#0f0018" }}>
          <button
            onClick={() => setShowQueue((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
          >
            <span className="font-display font-bold text-white flex items-center gap-2">
              <span
                className="rounded-lg px-2 py-0.5 text-xs font-extrabold uppercase tracking-widest text-black"
                style={{ background: "linear-gradient(135deg,#ff0080,#bf00ff)", color: "#fff" }}
              >
                🎵
              </span>
              View Queue
              {queueItems.length > 0 && (
                <span className="text-xs font-normal text-[#6a3a8a]">
                  {queueItems.length} song{queueItems.length !== 1 ? "s" : ""}
                </span>
              )}
            </span>
            <span className="text-[#ff0080] text-lg select-none">{showQueue ? "▲" : "▼"}</span>
          </button>

          {showQueue && (
            <div style={{ borderTop: "1.5px solid #2a0040" }}>
              {queueLoading && queueItems.length === 0 ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 rounded-full border-2 border-[#ff0080] border-t-transparent animate-spin" />
                </div>
              ) : queueItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#5a3070]">Queue is empty</p>
              ) : (
                <ul className="flex flex-col divide-y divide-[#1a0028]">
                  {queueItems.map((item, idx) => {
                    const isNow = item.videoId === currentVideoId && idx === 0;
                    return (
                      <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                        <img
                          src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                          alt=""
                          className="h-11 w-[72px] flex-shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          {isNow && (
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff0080] mb-0.5">
                              ▶ Now Playing
                            </p>
                          )}
                          <p className="truncate text-sm font-semibold text-[#f0e6ff] leading-snug">
                            {item.title ?? `Song ${idx + 1}`}
                          </p>
                        </div>
                        {!isNow && (
                          <span className="flex-shrink-0 text-xs text-[#3a1050] font-mono">#{idx + 1}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="px-4 py-2 text-right text-[10px] text-[#2a1040]">Auto-refreshes every 7s</p>
            </div>
          )}
        </div>

        {/* ── Share / QR ── */}
        <div className="neon-card-pink p-4 sm:p-5">
          <h2 className="font-display mb-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-[#ff0080]">
            ⭐ Share This Session ⭐
          </h2>
          <div className="flex justify-center mb-4">
            <QRCodeDisplay value={joinUrl} size={160} />
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={joinUrl}
              className="neon-input min-h-[44px] flex-1 px-3 py-2 text-sm font-mono truncate"
            />
            <button
              onClick={copyUrl}
              className="min-h-[44px] flex-shrink-0 rounded-lg border border-[#3a004a] bg-[#07000f] px-4 py-2 text-sm text-[#d0a0ff] hover:border-[#ff0080] hover:text-[#ff0080] transition-all"
            >
              {copied ? "Copied! ✓" : "Copy"}
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-[#3a1050]">
          Playback is controlled by the host.
        </p>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinPageInner />
    </Suspense>
  );
}
