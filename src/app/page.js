import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { BrowseFeed } from "@/components/browse/browse-feed";
import { mapAudiobookRecord } from "@/lib/audiobook-utils";

export const metadata = {
  title: "GolpoBook — Personalized Bengali Audiobooks & Stories",
  description: "Immerse yourself in rich Bengali classics, thrillers, literature, and audio stories with personalized recommendations.",
};

async function HomeDataLoader() {
  const supabase = await createClient();

  // 1. Fetch active categories ordered by display_order
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const categories = categoriesData || [];

  // 2. Fetch published audiobooks with joined author, category, and chapters
  const { data: audiobooksData } = await supabase
    .from("audiobooks")
    .select(`
      id,
      title,
      title_bengali,
      slug,
      narrator_name,
      description,
      short_description,
      cover_image_url,
      language,
      tier_requirement,
      is_featured,
      is_published,
      total_duration_seconds,
      rating_average,
      ratings_count,
      publication_year,
      tags,
      author:authors (name, slug),
      category:categories (name, slug),
      chapters (id, chapter_number, title, duration_seconds, is_preview)
    `)
    .eq("is_published", true)
    .order("ratings_count", { ascending: false });

  const audiobooks = (audiobooksData || []).map(mapAudiobookRecord);

  return (
    <BrowseFeed
      initialCategories={categories}
      initialAudiobooks={audiobooks}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <div className="size-10 bg-terracotta animate-pulse border-[1.5px] border-ink shadow-hard-xs" />
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-4">
            Curating your audio stories...
          </p>
        </div>
      }
    >
      <HomeDataLoader />
    </Suspense>
  );
}
