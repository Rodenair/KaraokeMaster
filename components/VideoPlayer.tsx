"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  videoId: string | undefined;
  onEnded?: () => void;
  title?: string;
}

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({ videoId, onEnded, title }: VideoPlayerProps) {
  // wrapperRef is always in the DOM — React owns it and never removes it.
  // YouTube is mounted into a *child* node so its DOM replacement
  // never invalidates the React-managed ref.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const onEndedRef = useRef(onEnded);
  const [apiReady, setApiReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keep callback ref current without triggering player effects
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  // Load the YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }
    if (!document.getElementById("yt-api-script")) {
      const script = document.createElement("script");
      script.id = "yt-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
    window.onYouTubeIframeAPIReady = () => setApiReady(true);
  }, []);

  // Manage player lifecycle whenever apiReady or videoId changes.
  // onEnded is intentionally excluded — accessed via ref so it never
  // causes a video reload.
  useEffect(() => {
    if (!apiReady) return;

    // Queue is empty: destroy the player so the iframe is fully removed
    if (!videoId) {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }

    if (!wrapperRef.current) return;

    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      return;
    }

    // Mount into a dedicated child node — not the React-managed wrapperRef div.
    // This prevents YouTube's iframe-replacement from confusing React's DOM diffing.
    const mountNode = document.createElement("div");
    mountNode.style.width = "100%";
    mountNode.style.height = "100%";
    wrapperRef.current.appendChild(mountNode);

    playerRef.current = new window.YT.Player(mountNode, {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        disablekb: 1,
        iv_load_policy: 3,
        fs: 0,
        cc_load_policy: 0,
      },
      events: {
        onStateChange(event: YT.OnStateChangeEvent) {
          if (event.data === window.YT.PlayerState.ENDED) {
            onEndedRef.current?.();
          }
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady, videoId]);

  // Destroy on unmount
  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const outerClass = isFullscreen
    ? "fixed inset-0 z-[100] bg-black transition-all duration-300"
    : "group relative w-full aspect-video overflow-hidden rounded-xl bg-black shadow-2xl transition-all duration-300";

  return (
    <div className={outerClass}>
      {/* Always in the DOM so React never reconciles it away */}
      <div ref={wrapperRef} className="absolute inset-0 w-full h-full" />

      {/* Empty-state overlay — sits on top when there's no video */}
      {!videoId && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ background: "#07000f", border: "1.5px solid #2a0040" }}
        >
          <div className="text-center px-4">
            <div className="mb-3 text-5xl animate-pulse-slow">🎤</div>
            <p
              className="font-display text-base font-bold uppercase tracking-widest"
              style={{ color: "#ff0080" }}
            >
              Waiting for a Song…
            </p>
            <p className="mt-1 text-xs" style={{ color: "#5a3070" }}>
              Share the join link and let the party begin!
            </p>
          </div>
        </div>
      )}

      {/* Enter-fullscreen button — only when a video is active */}
      {videoId && !isFullscreen && (
        <button
          onClick={() => setIsFullscreen(true)}
          aria-label="Enter fullscreen"
          className="absolute top-2 right-2 z-10 flex items-center justify-center h-9 w-9 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 sm:opacity-100 hover:bg-black/80 transition-all pointer-events-auto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      )}

      {/* Fullscreen overlay — song title + exit button */}
      {isFullscreen && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4 pointer-events-auto"
          style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
        >
          <div className="min-w-0 flex-1 mr-4">
            {title && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-[#ff0080]">▶ Now Playing</p>
                <p className="truncate font-display font-bold text-white text-lg">{title}</p>
              </>
            )}
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            aria-label="Exit fullscreen"
            className="flex-shrink-0 flex items-center gap-2 rounded-lg px-4 py-2 bg-black/70 text-white text-sm font-bold border border-white/20 hover:bg-white/20 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
              <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
            </svg>
            Exit Fullscreen
          </button>
        </div>
      )}
    </div>
  );
}
