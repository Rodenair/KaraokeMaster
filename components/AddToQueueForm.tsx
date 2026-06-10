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
        <label className="block mb-1.5 text-sm font-medium text-slate-300">
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
          className="w-full rounded-lg border border-[#2d2d4e] bg-[#0f0f1a] px-4 py-3 text-slate-100 placeholder-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-medium text-slate-300">
          Song title
          <span className="ml-1.5 text-xs text-slate-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Never Gonna Give You Up"
          maxLength={200}
          className="w-full rounded-lg border border-[#2d2d4e] bg-[#0f0f1a] px-4 py-3 text-slate-100 placeholder-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
        className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {status === "loading" ? "Adding…" : "Add to Queue"}
      </button>
    </form>
  );
}
