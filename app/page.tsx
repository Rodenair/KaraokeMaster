"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STARS = ["✨", "⭐", "🌟", "✨", "⭐"];

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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* ── Stage lighting blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[700px] rounded-full bg-[#ff0080]/20 blur-[140px]" />
        <div className="absolute bottom-0 left-0 h-[450px] w-[450px] rounded-full bg-[#00d4ff]/15 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#bf00ff]/20 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-[300px] w-[300px] rounded-full bg-[#ffd700]/10 blur-[110px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* ── Branding ── */}
        <div className="mb-8 text-center select-none">
          {/* Twinkling stars row */}
          <div className="flex justify-center gap-3 mb-3">
            {STARS.map((s, i) => (
              <span
                key={i}
                className="text-xl animate-twinkle"
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Mic icon */}
          <div className="text-7xl mb-2 drop-shadow-[0_0_20px_rgba(255,0,128,0.8)]">🎤</div>

          {/* App name */}
          <h1
            className="font-display text-6xl font-extrabold uppercase tracking-wide"
            style={{
              background: "linear-gradient(90deg,#ff0080,#ff8c00,#ffd700,#00ff88,#00d4ff,#bf00ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 8px rgba(255,0,128,0.5))",
            }}
          >
            Videoke!
          </h1>

          {/* Tagline */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-[#ffd700] text-sm">♪</span>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[#ffd700]">
              Pinoy Karaoke Night
            </p>
            <span className="text-[#ffd700] text-sm">♪</span>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="neon-card p-6 shadow-2xl">
          <h2 className="font-display mb-5 text-center text-xl font-bold text-white">
            🎵 Start a Session
          </h2>

          <label className="mb-1.5 block text-sm font-semibold text-[#d0a0ff]">
            Your name <span className="font-normal text-[#6a3a8a]">(optional)</span>
          </label>
          <input
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createSession()}
            placeholder="e.g. Maria, Juan, Ate Nena…"
            maxLength={64}
            style={{ fontSize: "16px" }}
            className="neon-input mb-5 w-full px-4 py-3"
          />

          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

          <button
            onClick={createSession}
            disabled={loading}
            className="btn-gold w-full rounded-xl py-4 text-lg uppercase shadow-lg shadow-yellow-900/40"
          >
            {loading ? "Starting…" : "🎤 Host Karaoke!"}
          </button>

          <p className="mt-5 text-center text-xs text-[#5a3070]">
            No account needed · Session data clears on server restart
          </p>
        </div>
      </div>
    </main>
  );
}
