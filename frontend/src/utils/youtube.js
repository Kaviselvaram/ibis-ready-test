export function getYouTubeId(url = "") {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{6,})/);
  return match?.[1] || "dQw4w9WgXcQ";
}

export function getYouTubeThumbnail(url) {
  return `https://img.youtube.com/vi/${getYouTubeId(url)}/maxresdefault.jpg`;
}

export function getYouTubeEmbed(url) {
  return `https://www.youtube.com/embed/${getYouTubeId(url)}?autoplay=1&rel=0`;
}
