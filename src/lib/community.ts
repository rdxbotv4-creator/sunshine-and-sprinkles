import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StatKind = "view" | "pdf_read" | "pdf_download";

export const statsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["novel-stats", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novel_stats")
        .select("views, pdf_reads, pdf_downloads")
        .eq("novel_slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ?? { views: 0, pdf_reads: 0, pdf_downloads: 0 };
    },
  });

export const allStatsQuery = () =>
  queryOptions({
    queryKey: ["novel-stats", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novel_stats")
        .select("novel_slug, views, pdf_reads, pdf_downloads");
      if (error) throw error;
      return data ?? [];
    },
  });

export const ratingQuery = (slug: string) =>
  queryOptions({
    queryKey: ["novel-rating", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novel_ratings")
        .select("avg_rating, rating_count")
        .eq("novel_slug", slug)
        .maybeSingle();
      if (error) throw error;
      return { avg: Number(data?.avg_rating ?? 0), count: data?.rating_count ?? 0 };
    },
  });

export const reviewsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["reviews", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, name, rating, comment, created_at")
        .eq("novel_slug", slug)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

export const latestReviewsQuery = () =>
  queryOptions({
    queryKey: ["reviews", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, novel_slug, name, rating, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

export const pdfQuery = (slug: string) =>
  queryOptions({
    queryKey: ["novel-pdf", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novel_pdfs")
        .select("novel_slug, file_path, file_size, uploaded_at")
        .eq("novel_slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const pdfListQuery = () =>
  queryOptions({
    queryKey: ["novel-pdf", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novel_pdfs")
        .select("novel_slug, file_path, file_size, uploaded_at")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export async function bumpStat(slug: string, kind: StatKind) {
  const { error } = await supabase.rpc("bump_stat", { _slug: slug, _kind: kind });
  if (error) console.warn("stat not counted", error.message);
}

export async function pdfUrl(filePath: string, download: boolean) {
  const { data, error } = await supabase.storage
    .from("novel-pdfs")
    .createSignedUrl(filePath, 60 * 60, download ? { download: true } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

export async function addReview(input: {
  slug: string;
  name: string;
  rating: number;
  comment: string;
}) {
  const { error } = await supabase.from("reviews").insert({
    novel_slug: input.slug,
    name: input.name.trim().slice(0, 60),
    rating: input.rating,
    comment: input.comment.trim().slice(0, 1000),
  });
  if (error) throw error;
}

export async function sendFeedback(input: { name: string; contact: string; message: string }) {
  const { error } = await supabase.from("feedback").insert({
    name: input.name.trim().slice(0, 80),
    contact: input.contact.trim().slice(0, 120),
    message: input.message.trim().slice(0, 2000),
  });
  if (error) throw error;
}
