"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createSession() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: hostName.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      router.push(`/session/${data.sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-pink-700/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 mb-4">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse-slow" />
            No account required
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Modern Karaoke
            </span>
          </h1>
          <p className="mt-3 text-slate-400">
            Start a session. Share the link. Let everyone add songs.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#2d2d4e] bg-[#1a1a2e] p-8 shadow-2xl">
          <h2 className="mb-6 text-lg font-semibold text-slate-100">
            Start a new session
          </h2>

          <label className="block mb-1.5 text-sm text-slate-400">
            Your name <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createSession()}
            placeholder="e.g. Alex"
            maxLength={64}
            className="mb-4 w-full rounded-lg border border-[#2d2d4e] bg-[#0f0f1a] px-4 py-3 text-slate-100 placeholder-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          {error && (
            <p className="mb-3 text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={createSession}
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Creating…" : "Create Session"}
          </button>

          <p className="mt-5 text-center text-xs text-slate-600">
            Session data lives only while the server is running.
            Restarting clears everything.
          </p>
        </div>
      </div>
    </main>
  );
}
