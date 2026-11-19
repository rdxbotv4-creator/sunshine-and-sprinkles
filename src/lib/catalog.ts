import raw from "@/data/catalog.json";

export type Episode = {
  id: string;
  t: string;
  ep: number | null;
  s: number | null;
  d: number;
  v: number;
};

export type Novel = {
  slug: string;
  name: string;
  urdu: string | null;
  subtitle: string | null;
  untitled: boolean;
  author: string | null;
  authorSlug: string | null;
  cats: string[];
  format: "series" | "complete";
  playlist: string | null;
  duration: number;
  views: number;
  recent: number;
  eps: Episode[];
};

export type Category = { slug: string; name: string; count: number };
export type Author = { name: string; slug: string; playlists: string[]; novels: string[] };
export type Collection = { id: string; title: string; novels: string[]; count: number };

type Catalog = {
  channel: { name: string; handle: string; id: string; url: string };
  generatedAt: string;
  totalVideos: number;
  categories: Category[];
  authors: Author[];
  collections: Collection[];
  novels: Novel[];
};

export const catalog = raw as unknown as Catalog;
export const channel = catalog.channel;
export const novels = catalog.novels;
export const categories = catalog.categories;
export const authors = catalog.authors;
export const collections = catalog.collections;

const novelMap = new Map(novels.map((n) => [n.slug, n]));
const authorMap = new Map(authors.map((a) => [a.slug, a]));
const categoryMap = new Map(categories.map((c) => [c.slug, c]));

export const getNovel = (slug: string) => novelMap.get(slug);
export const getAuthor = (slug: string) => authorMap.get(slug);
export const getCategory = (slug: string) => categoryMap.get(slug);

export function novelsOf(slugs: string[]): Novel[] {
  return slugs.map((s) => novelMap.get(s)).filter((n): n is Novel => Boolean(n));
}

export const byViews = [...novels].sort((a, b) => b.views - a.views);
export const byRecent = [...novels].sort((a, b) => b.recent - a.recent);

export function novelsInCategory(slug: string): Novel[] {
  return byViews.filter((n) => n.cats.includes(slug));
}

export function searchNovels(q: string, list: Novel[] = byViews): Novel[] {
  const term = q.trim().toLowerCase();
  if (!term) return list;
  return list.filter(
    (n) =>
      n.name.toLowerCase().includes(term) ||
      (n.author ?? "").toLowerCase().includes(term) ||
      (n.urdu ?? "").includes(q.trim()) ||
      n.eps.some((e) => e.t.toLowerCase().includes(term)),
  );
}

export const thumb = (videoId: string, quality: "hq" | "mq" | "maxres" = "hq") =>
  `https://i.ytimg.com/vi/${videoId}/${quality}default.jpg`;

export const coverOf = (n: Novel) => thumb(n.eps[0]?.id ?? "", "hq");

export function formatViews(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const totalNovels = novels.length;
export const totalVideos = catalog.totalVideos;
export const totalViews = novels.reduce((sum, n) => sum + n.views, 0);

export const OWNER = {
  name: "Sardar Rdx",
  whatsapp: "923301068874",
  whatsappDisplay: "+92 330 1068874",
};

export const whatsappLink = (text = "Assalam o Alaikum! I came from the Novels Forever website.") =>
  `https://wa.me/${OWNER.whatsapp}?text=${encodeURIComponent(text)}`;

export const findPdfLink = (n: Novel) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${n.name} novel${n.author ? ` by ${n.author}` : ""} pdf download`)}`;

export const youtubeVideoLink = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubePlaylistLink = (id: string) => `https://www.youtube.com/playlist?list=${id}`;
