import { NextRequest, NextResponse } from "next/server";
import type { SearchResult } from "@/lib/types";

const YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
  }

  const url = new URL(YT_SEARCH_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "8");
  // Always append "karaoke" so results stay relevant regardless of user input
  url.searchParams.set("q", q.toLowerCase().includes("karaoke") ? q : `${q} karaoke`);
  url.searchParams.set("key", apiKey);

  const ytRes = await fetch(url.toString(), {
    // Revalidate cache every 60 s so identical queries don't burn quota
    next: { revalidate: 60 },
  });

  if (!ytRes.ok) {
    const err = await ytRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: "YouTube API error", detail: err },
      { status: ytRes.status }
    );
  }

  const data = await ytRes.json();

  const results: SearchResult[] = (data.items ?? []).map(
    (item: {
      id: { videoId: string };
      snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; default?: { url: string } } };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
      channelTitle: item.snippet.channelTitle,
    })
  );

  return NextResponse.json({ results });
}
