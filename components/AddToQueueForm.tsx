"use client";

import { useState } from "react";

interface AddToQueueFormProps {
  sessionId: string;
  onAdded?: (title?: string) => void;
}

export default function AddToQueueForm({ sessionId, onAdded }: AddToQueueFormProps) {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/sessions/${sessionId}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: input.trim(),
          title: title.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to add song");
      }

      setStatus("success");
      setMessage(`"${data.item.title ?? data.item.videoId}" added to the queue!`);
      setInput("");
      setTitle("");
      onAdded?.(data.item.title);

      // Reset back to idle after a delay
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 4000);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1.5 text-sm font-semibold text-[#d0a0ff]">
          YouTube URL or Video ID
          <span className="ml-1.5 text-xs text-slate-500 font-normal">
            (youtube.com/watch?v=… or youtu.be/…)
          </span>
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          required
          className="neon-input w-full px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-semibold text-[#d0a0ff]">
          Song title
          <span className="ml-1.5 text-xs text-slate-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Never Gonna Give You Up"
          maxLength={200}
          className="neon-input w-full px-4 py-3 text-base"
        />
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            status === "success"
              ? "bg-green-500/15 border border-green-500/30 text-green-300"
              : "bg-red-500/15 border border-red-500/30 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !input.trim()}
        className="btn-pink w-full min-h-[48px] rounded-xl px-6 py-3 uppercase tracking-wide shadow-lg shadow-pink-900/40"
      >
        {status === "loading" ? "Adding…" : "Add to Queue"}
      </button>
    </form>
  );
}
