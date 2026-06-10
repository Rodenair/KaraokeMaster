/**
 * Extracts a YouTube videoId from a variety of URL formats or a plain videoId.
 *
 * Supported input forms:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://www.youtube.com/shorts/VIDEO_ID
 *   VIDEO_ID (11-char alphanumeric string)
 */
const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function extractVideoId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;

  // Plain videoId
  if (YT_ID_RE.test(s)) return s;

  try {
    const url = new URL(s);

    // youtu.be/VIDEO_ID
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("?")[0];
      return YT_ID_RE.test(id) ? id : null;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (url.hostname.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && YT_ID_RE.test(v)) return v;

      // /embed/VIDEO_ID  or  /shorts/VIDEO_ID
      const match = url.pathname.match(/\/(embed|shorts|v)\/([A-Za-z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch {
    // not a valid URL
  }

  return null;
}
