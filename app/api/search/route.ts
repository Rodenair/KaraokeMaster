import { NextRequest, NextResponse } from "next/server";
import type { SearchResult } from "@/lib/types";

const YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YT_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

type RawItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
  };
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
  }

  // ── Step 1: search (fetch extra to cover non-embeddable videos) ──────────
  const searchUrl = new URL(YT_SEARCH_URL);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "14");
  searchUrl.searchParams.set(
    "q",
    q.toLowerCase().includes("karaoke") ? q : `${q} karaoke`
  );
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl.toString(), { next: { revalidate: 60 } });
  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    return NextResponse.json({ error: "YouTube API error", detail: err }, { status: searchRes.status });
  }

  const searchData = await searchRes.json();
  const items: RawItem[] = searchData.items ?? [];
  if (items.length === 0) return NextResponse.json({ results: [] });

  // ── Step 2: check embeddability via videos.list (costs only 1 quota unit) ─
  const ids = items.map((i) => i.id.videoId).join(",");
  const statusUrl = new URL(YT_VIDEOS_URL);
  statusUrl.searchParams.set("part", "status");
  statusUrl.searchParams.set("id", ids);
  statusUrl.searchParams.set("key", apiKey);

  const statusRes = await fetch(statusUrl.toString(), { next: { revalidate: 60 } });
  if (!statusRes.ok) {
    const err = await statusRes.json().catch(() => ({}));
    return NextResponse.json({ error: "YouTube API error", detail: err }, { status: statusRes.status });
  }

  const statusData = await statusRes.json();
  const embeddableIds = new Set<string>(
    (statusData.items ?? [])
      .filter((v: { status: { embeddable: boolean } }) => v.status.embeddable)
      .map((v: { id: string }) => v.id)
  );

  // ── Step 3: filter non-embeddable and return up to 8 results ─────────────
  const results: SearchResult[] = items
    .filter((item) => embeddableIds.has(item.id.videoId))
    .slice(0, 8)
    .map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
      channelTitle: item.snippet.channelTitle,
    }));

  return NextResponse.json({ results });
}
