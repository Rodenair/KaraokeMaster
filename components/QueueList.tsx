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

export default function QueueList({ queue, currentVideoId, onNext, onReset, loading }: QueueListProps) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1.5px solid #3a004a", background: "#0f0018" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1.5px solid #2a0040" }}
      >
        <h2 className="font-display font-bold text-white flex items-center gap-2">
          <span className="text-[#ffd700]">♫</span>
          Queue
          <span
            className="rounded-full px-2 py-0.5 text-xs font-extrabold text-black"
            style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00)" }}
          >
            {queue.length}
          </span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onNext}
            disabled={loading || queue.length === 0}
            className="min-h-[40px] rounded-lg border border-[#3a004a] bg-[#07000f] px-3 py-1.5 text-sm font-bold text-[#00d4ff] hover:bg-[#00d4ff]/20 hover:border-[#00d4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Skip ⏭
          </button>
          <button
            onClick={onReset}
            disabled={loading}
            className="min-h-[40px] rounded-lg border border-[#3a004a] bg-[#07000f] px-3 py-1.5 text-sm font-bold text-red-400 hover:bg-red-600/20 hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Items */}
      {queue.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <div className="text-3xl mb-2">🎤</div>
          <p className="text-sm text-[#5a3070]">Queue is empty — share the join link!</p>
        </div>
      ) : (
        <ol className="max-h-[420px] overflow-y-auto divide-y divide-[#1e0030]">
          {queue.map((item, index) => {
            const isCurrent = item.videoId === currentVideoId && index === 0;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={
                  isCurrent
                    ? { background: "linear-gradient(135deg, rgba(255,0,128,0.12), rgba(191,0,255,0.12))" }
                    : undefined
                }
              >
                {/* Position badge */}
                <span
                  className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-full text-xs font-extrabold"
                  style={
                    isCurrent
                      ? { background: "linear-gradient(135deg,#ff0080,#bf00ff)", color: "#fff" }
                      : { background: "#1e0030", color: "#9060b0" }
                  }
                >
                  {isCurrent ? "▶" : index + 1}
                </span>

                {/* Thumbnail */}
                <img
                  src={`https://img.youtube.com/vi/${item.videoId}/default.jpg`}
                  alt=""
                  className="h-10 w-[54px] rounded-lg object-cover flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`truncate text-sm font-semibold ${isCurrent ? "text-white" : "text-[#d0a0ff]"}`}>
                    {item.title ?? `Video ${item.videoId}`}
                  </p>
                  <p className="text-xs text-[#5a3070] truncate">
                    {formatDuration(item.duration) ? `${formatDuration(item.duration)} · ` : ""}
                    {new Date(item.addedAt).toLocaleTimeString()}
                  </p>
                </div>

                {isCurrent && (
                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold text-black"
                    style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00)" }}
                  >
                    ▶ NOW
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
