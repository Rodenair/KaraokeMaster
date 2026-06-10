"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import AddToQueueForm from "@/components/AddToQueueForm";

// QRCodeDisplay uses qrcode.react which is client-only
const QRCodeDisplay = dynamic(() => import("@/components/QRCodeDisplay"), { ssr: false });

function JoinPageInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const [addedCount, setAddedCount] = useState(0);

  if (!sessionId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No session ID provided.</p>
          <Link href="/" className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500">
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

  return (
    <main className="min-h-screen px-4 py-10">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 right-1/3 h-[400px] w-[400px] rounded-full bg-pink-700/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-purple-700/15 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-sm text-pink-300 mb-4">
            <span className="h-2 w-2 rounded-full bg-pink-400 animate-pulse-slow" />
            Karaoke Session
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Add a Song
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Paste a YouTube URL to add it to the host&apos;s queue.
          </p>
        </div>

        {/* QR code + share */}
        <div className="rounded-2xl border border-[#2d2d4e] bg-[#1a1a2e] p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-400 mb-4 text-center uppercase tracking-wider">
            Share this session
          </h2>
          <div className="flex justify-center mb-4">
            <QRCodeDisplay value={joinUrl} size={180} />
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={joinUrl}
              className="flex-1 rounded-lg border border-[#2d2d4e] bg-[#0f0f1a] px-3 py-2 text-sm font-mono text-slate-300 truncate focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => navigator.clipboard.writeText(joinUrl)}
              className="rounded-lg border border-[#2d2d4e] bg-[#0f0f1a] px-3 py-2 text-sm text-slate-400 hover:bg-purple-600/20 hover:border-purple-500 hover:text-purple-300 transition-all whitespace-nowrap"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Add to queue form */}
        <div className="rounded-2xl border border-[#2d2d4e] bg-[#1a1a2e] p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-5">
            Queue a song
            {addedCount > 0 && (
              <span className="ml-2 text-sm text-purple-400 font-normal">
                ({addedCount} added this session)
              </span>
            )}
          </h2>
          <AddToQueueForm
            sessionId={sessionId}
            onAdded={() => setAddedCount((n) => n + 1)}
          />
        </div>

        <p className="mt-6 text-center text-xs text-slate-700">
          Playback is controlled by the host. Your addition will appear in the host&apos;s queue.
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
