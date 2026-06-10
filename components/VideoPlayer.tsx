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
  // wrapperRef is always in the DOM — React owns it and never removes it.
  // YouTube is mounted into a *child* node so its DOM replacement
  // never invalidates the React-managed ref.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const onEndedRef = useRef(onEnded);
  const [apiReady, setApiReady] = useState(false);

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

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
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
    </div>
  );
}
