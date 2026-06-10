"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AddToQueueForm from "./AddToQueueForm";
import type { SearchResult } from "@/lib/types";

interface VideoSearchFormProps {
  sessionId: string;
  onAdded?: (title?: string) => void;
}

const DEBOUNCE_MS = 500;

export default function VideoSearchForm({ sessionId, onAdded }: VideoSearchFormProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  // Track per-video add state: "idle" | "loading" | "added" | "error"
  const [cardState, setCardState] = useState<Record<string, "loading" | "added" | "error">>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearchError("");
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  async function addToQueue(result: SearchResult) {
    setCardState((s) => ({ ...s, [result.videoId]: "loading" }));
    try {
      const res = await fetch(`/api/sessions/${sessionId}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: result.videoId, title: result.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setCardState((s) => ({ ...s, [result.videoId]: "added" }));
      onAdded?.(result.title);
      // Reset card back to idle after 2 s
      setTimeout(() => {
        setCardState((s) => {
          const next = { ...s };
          delete next[result.videoId];
          return next;
        });
      }, 2000);
    } catch {
      setCardState((s) => ({ ...s, [result.videoId]: "error" }));
      setTimeout(() => {
        setCardState((s) => {
          const next = { ...s };
          delete next[result.videoId];
          return next;
        });
      }, 2500);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a karaoke song…"
          className="w-full rounded-lg border border-[#2d2d4e] bg-[#0f0f1a] px-4 py-3 pr-10 text-base text-slate-100 placeholder-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* Error */}
      {searchError && (
        <p className="text-sm text-red-400">{searchError}</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-0.5">
          {results.map((result) => {
            const state = cardState[result.videoId];
            const isAdded = state === "added";
            const isLoading = state === "loading";
            const isError = state === "error";

            return (
              <li
                key={result.videoId}
                className="flex items-center gap-3 rounded-xl border border-[#2d2d4e] bg-[#0f0f1a] p-2.5 transition-colors hover:border-purple-500/40"
              >
                {/* Thumbnail */}
                <img
                  src={result.thumbnail}
                  alt=""
                  className="h-14 w-[100px] flex-shrink-0 rounded-lg object-cover"
                />

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p
                    className="line-clamp-2 text-sm font-medium text-slate-100 leading-snug"
                    dangerouslySetInnerHTML={{ __html: result.title }}
                  />
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {result.channelTitle}
                  </p>
                </div>

                {/* Add button */}
                <button
                  onClick={() => !isLoading && !isAdded && addToQueue(result)}
                  disabled={isLoading || isAdded}
                  className={`min-h-[40px] flex-shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                    isAdded
                      ? "bg-green-600/20 border border-green-500/40 text-green-400 cursor-default"
                      : isError
                      ? "bg-red-600/20 border border-red-500/40 text-red-400"
                      : "bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white disabled:opacity-50"
                  }`}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                  ) : isAdded ? (
                    "Added ✓"
                  ) : isError ? (
                    "Error"
                  ) : (
                    "Add +"
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Empty state — only show after user has typed something */}
      {!searching && query.trim() && results.length === 0 && !searchError && (
        <p className="text-center text-sm text-slate-600 py-4">
          No results for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Paste URL fallback */}
      <div className="border-t border-[#2d2d4e] pt-3">
        <button
          onClick={() => setShowPaste((v) => !v)}
          className="text-xs text-slate-600 hover:text-purple-400 transition-colors"
        >
          {showPaste ? "▲ Hide" : "▼ Paste a URL instead"}
        </button>
        {showPaste && (
          <div className="mt-3">
            <AddToQueueForm sessionId={sessionId} onAdded={onAdded} />
          </div>
        )}
      </div>
    </div>
  );
}
