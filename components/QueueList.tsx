"use client";

import type { QueueItem } from "@/lib/types";

interface QueueListProps {
  queue: QueueItem[];
  currentVideoId?: string;
  onNext: () => void;
  onReset: () => void;
  loading: boolean;
}

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QueueList({
  queue,
  currentVideoId,
  onNext,
  onReset,
  loading,
}: QueueListProps) {
  return (
    <div className="rounded-xl border border-[#2d2d4e] bg-[#1a1a2e] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d4e]">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <span className="text-purple-400">♫</span>
          Queue
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
            {queue.length}
          </span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onNext}
            disabled={loading || queue.length === 0}
            title="Skip to next song"
            className="rounded-lg border border-[#2d2d4e] bg-[#0f0f1a] px-3 py-1.5 text-sm text-slate-300 hover:bg-purple-600 hover:border-purple-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Skip →
          </button>
          <button
            onClick={onReset}
            disabled={loading}
            title="Clear the entire queue"
            className="rounded-lg border border-[#2d2d4e] bg-[#0f0f1a] px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/20 hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Items */}
      {queue.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-600">
          The queue is empty. Share the join link to get songs added!
        </div>
      ) : (
        <ol className="divide-y divide-[#2d2d4e] max-h-[420px] overflow-y-auto">
          {queue.map((item, index) => {
            const isCurrent = item.videoId === currentVideoId && index === 0;
            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isCurrent ? "bg-purple-500/10" : "hover:bg-white/5"
                }`}
              >
                {/* Position badge */}
                <span
                  className={`flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent
                      ? "bg-purple-600 text-white"
                      : "bg-[#2d2d4e] text-slate-400"
                  }`}
                >
                  {isCurrent ? "▶" : index + 1}
                </span>

                {/* Thumbnail */}
                <img
                  src={`https://img.youtube.com/vi/${item.videoId}/default.jpg`}
                  alt=""
                  className="h-10 w-[54px] rounded object-cover flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`truncate text-sm font-medium ${isCurrent ? "text-purple-200" : "text-slate-200"}`}>
                    {item.title ?? `Video ${item.videoId}`}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {formatDuration(item.duration)
                      ? `${formatDuration(item.duration)} · `
                      : ""}
                    Added {new Date(item.addedAt).toLocaleTimeString()}
                  </p>
                </div>

                {isCurrent && (
                  <span className="flex-shrink-0 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-400 border border-purple-500/30">
                    Now Playing
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
