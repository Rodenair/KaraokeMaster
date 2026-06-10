"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  videoId: string | undefined;
  onEnded?: () => void;
}

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({ videoId, onEnded }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const onEndedRef = useRef(onEnded);
  const [apiReady, setApiReady] = useState(false);

  // Keep the callback ref current on every render without triggering player effects
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

  // Create player once; update video via loadVideoById when videoId changes.
  // onEnded is intentionally excluded from deps — it's accessed via ref so it
  // never causes a reload of the current video.
  useEffect(() => {
    if (!apiReady || !videoId || !containerRef.current) return;

    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      return;
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
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

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-[#2d2d4e] bg-[#1a1a2e] text-slate-500">
        <div className="text-center px-4">
          <div className="mb-2 text-4xl">🎤</div>
          <p className="text-sm">No video queued yet</p>
          <p className="text-xs text-slate-600 mt-1">
            Share the join link so participants can add songs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
