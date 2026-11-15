import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { BrowseFeed } from "@/components/browse/browse-feed";
import { mapAudiobookRecord } from "@/lib/audiobook-utils";

export const metadata = {
  title: "Audiobook Catalog — GolpoBook",
  description: "Browse the complete collection of classic Bengali literature, thrillers, adventures, and global audiobooks.",
};

async function AudiobooksDataLoader() {
  const supabase = await createClient();

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

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

  const categories = categoriesData || [];
  const audiobooks = (audiobooksData || []).map(mapAudiobookRecord);

  return (
    <BrowseFeed
      initialCategories={categories}
      initialAudiobooks={audiobooks}
    />
  );
}

export default function AudiobooksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <div className="size-10 bg-terracotta animate-pulse border-[1.5px] border-ink shadow-hard-xs" />
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-4">
            Loading catalog...
          </p>
        </div>
      }
    >
      <AudiobooksDataLoader />
    </Suspense>
  );
}
