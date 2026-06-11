"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AddToQueueForm from "./AddToQueueForm";
import type { SearchResult } from "@/lib/types";

interface VideoSearchFormProps {
  sessionId: string;
  onAdded?: (title?: string) => void;
}

const DEBOUNCE_MS = 500;

const GENRES = [
  { label: "OPM",    query: "OPM hits" },
  { label: "Pop",    query: "pop hits 2024" },
  { label: "Rock",   query: "rock classics" },
  { label: "Ballad", query: "love songs ballad" },
  { label: "Party",  query: "party songs bpm" },
] as const;

type GenreLabel = typeof GENRES[number]["label"];

function SongCard({
  result,
  state,
  onAdd,
}: {
  result: SearchResult;
  state: "loading" | "added" | "error" | undefined;
  onAdd: (r: SearchResult) => void;
}) {
  const isAdded   = state === "added";
  const isLoading = state === "loading";
  const isError   = state === "error";

  return (
    <li
      className="flex items-center gap-3 rounded-xl p-2.5 transition-all"
      style={{
        background: isAdded ? "rgba(0,255,136,0.08)" : "rgba(15,0,24,0.8)",
        border: `1.5px solid ${isAdded ? "rgba(0,255,136,0.4)" : "#2a0040"}`,
      }}
    >
      <img
        src={result.thumbnail}
        alt=""
        className="h-14 w-[100px] flex-shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <p
          className="line-clamp-2 text-sm font-semibold leading-snug text-[#f0e6ff]"
          dangerouslySetInnerHTML={{ __html: result.title }}
        />
        <p className="mt-0.5 truncate text-xs text-[#6a3a8a]">{result.channelTitle}</p>
      </div>
      <button
        onClick={() => !isLoading && !isAdded && onAdd(result)}
        disabled={isLoading || isAdded}
        className="min-h-[40px] flex-shrink-0 rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all"
        style={
          isAdded
            ? { background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1.5px solid rgba(0,255,136,0.4)", cursor: "default" }
            : isError
            ? { background: "rgba(255,60,60,0.15)", color: "#ff6060", border: "1.5px solid rgba(255,60,60,0.4)" }
            : { background: "linear-gradient(135deg,#ff0080,#bf00ff)", color: "#fff", border: "none" }
        }
      >
        {isLoading ? (
          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : isAdded ? "Added ✓" : isError ? "Error" : "Add +"}
      </button>
    </li>
  );
}

export default function VideoSearchForm({ sessionId, onAdded }: VideoSearchFormProps) {
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<SearchResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showPaste, setShowPaste]     = useState(false);
  const [cardState, setCardState]     = useState<Record<string, "loading" | "added" | "error">>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recommendations state
  const [activeGenre, setActiveGenre] = useState<GenreLabel>("OPM");
  const [recResults,  setRecResults]  = useState<SearchResult[]>([]);
  const [recLoading,  setRecLoading]  = useState(false);
  const [recError,    setRecError]    = useState("");
  const recCacheRef = useRef<Partial<Record<GenreLabel, SearchResult[]>>>({});

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
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

  const fetchGenre = useCallback(async (genre: GenreLabel) => {
    if (recCacheRef.current[genre]) {
      setRecResults(recCacheRef.current[genre]!);
      setRecError("");
      return;
    }
    setRecLoading(true);
    setRecError("");
    setRecResults([]);
    try {
      const q = GENRES.find((g) => g.label === genre)!.query;
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load recommendations");
      const items: SearchResult[] = data.results ?? [];
      recCacheRef.current[genre] = items;
      setRecResults(items);
    } catch (e) {
      setRecError(e instanceof Error ? e.message : "Could not load recommendations");
    } finally {
      setRecLoading(false);
    }
  }, []);

  // Debounced live search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setSearchError(""); return; }
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  // Fetch default genre on mount
  useEffect(() => { fetchGenre("OPM"); }, [fetchGenre]);

  function handleGenreClick(genre: GenreLabel) {
    setActiveGenre(genre);
    fetchGenre(genre);
  }

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
      setTimeout(() => setCardState((s) => { const n = { ...s }; delete n[result.videoId]; return n; }), 2000);
    } catch {
      setCardState((s) => ({ ...s, [result.videoId]: "error" }));
      setTimeout(() => setCardState((s) => { const n = { ...s }; delete n[result.videoId]; return n; }), 2500);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff0080] text-base select-none">🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search song or artist…"
          className="neon-input w-full py-3 pl-9 pr-10 text-base"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full border-2 border-[#ff0080] border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {searchError && <p className="text-sm text-red-400">{searchError}</p>}

      {/* ── Recommendations: shown when no query is typed ── */}
      {!query.trim() && (
        <div className="flex flex-col gap-3">
          {/* Genre chips */}
          <div className="flex flex-wrap gap-2">
            {GENRES.map(({ label }) => (
              <button
                key={label}
                onClick={() => handleGenreClick(label)}
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all"
                style={
                  label === activeGenre
                    ? { background: "linear-gradient(135deg,#ff0080,#bf00ff)", color: "#fff", border: "1.5px solid transparent" }
                    : { background: "#0f0018", color: "#d0a0ff", border: "1.5px solid #3a004a" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-[#6a3a8a]">Recommended</p>

          {recLoading && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 rounded-full border-2 border-[#ff0080] border-t-transparent animate-spin" />
            </div>
          )}

          {recError && !recLoading && <p className="text-sm text-red-400">{recError}</p>}

          {!recLoading && recResults.length > 0 && (
            <ul className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-0.5">
              {recResults.map((result) => (
                <SongCard
                  key={result.videoId}
                  result={result}
                  state={cardState[result.videoId]}
                  onAdd={addToQueue}
                />
              ))}
            </ul>
          )}

          {!recLoading && !recError && recResults.length === 0 && (
            <p className="py-4 text-center text-sm text-[#5a3070]">No recommendations found</p>
          )}
        </div>
      )}

      {/* ── Search results: shown when query is typed ── */}
      {query.trim() && results.length > 0 && (
        <ul className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-0.5">
          {results.map((result) => (
            <SongCard
              key={result.videoId}
              result={result}
              state={cardState[result.videoId]}
              onAdd={addToQueue}
            />
          ))}
        </ul>
      )}

      {query.trim() && !searching && results.length === 0 && !searchError && (
        <p className="py-4 text-center text-sm text-[#5a3070]">
          No results for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Paste URL fallback */}
      <div className="border-t border-[#2a0040] pt-3">
        <button
          onClick={() => setShowPaste((v) => !v)}
          className="text-xs text-[#5a3070] hover:text-[#ff0080] transition-colors"
        >
          {showPaste ? "▲ Hide" : "▼ Paste a YouTube URL instead"}
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
