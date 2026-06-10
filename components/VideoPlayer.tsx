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
  const [apiReady, setApiReady] = useState(false);

  // Load the YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }
    const existingScript = document.getElementById("yt-api-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "yt-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
    window.onYouTubeIframeAPIReady = () => setApiReady(true);
    return () => {
      // leave the global callback so other components can also use it
    };
  }, []);

  // Create or update the player when apiReady or videoId changes
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
        rel: 0,
        modestbranding: 1,
        fs: 1,
      },
      events: {
        onStateChange(event: YT.OnStateChangeEvent) {
          if (event.data === window.YT.PlayerState.ENDED) {
            onEnded?.();
          }
        },
      },
    });
  }, [apiReady, videoId, onEnded]);

  // Destroy player on unmount
  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-[#2d2d4e] bg-[#1a1a2e] text-slate-500">
        <div className="text-center">
          <div className="mb-2 text-4xl">🎤</div>
          <p className="text-sm">No video queued yet</p>
          <p className="text-xs text-slate-600 mt-1">Share the join link so participants can add songs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-[#2d2d4e] shadow-2xl bg-black">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
