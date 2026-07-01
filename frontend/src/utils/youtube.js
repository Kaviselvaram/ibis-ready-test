// Extracts an 11-char YouTube video id from any common URL form, including
// unlisted watch links, youtu.be, /embed, /shorts, /live and nocookie embeds.
// Returns "" when nothing valid is found (no placeholder video in production).
export function getYouTubeId(input = "") {
  const str = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str; // already a bare id
  const m = str.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return m?.[1] || "";
}

export function getYouTubeThumbnail(input) {
  const id = getYouTubeId(input);
  // hqdefault is available for effectively every video (unlike maxresdefault).
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

// Privacy-enhanced, low-branding embed. Unlisted videos embed identically.
// Uses youtube-nocookie.com and suppresses related videos / annotations.
export function getYouTubeEmbed(input, { autoplay = true } = {}) {
  const id = getYouTubeId(input);
  if (!id) return "";
  const params = new URLSearchParams({
    rel: "0",             // don't surface other channels' videos
    modestbranding: "1",  // minimal YouTube chrome
    iv_load_policy: "3",  // hide annotations
    playsinline: "1",
    fs: "1",
    color: "white",
  });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
