import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapAudiobookRecord } from "@/lib/audiobook-utils";
import { SavedView } from "@/components/library/saved-view";

export const metadata = {
  title: "Saved Shelf — GolpoBook",
  description: "Your bookmarked Bengali and English audiobooks on GolpoBook.",
};

async function SavedDataLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let savedBooks = [];

  if (user) {
    const { data: rows } = await supabase
      .from("bookmarks")
      .select(`
        created_at,
        audiobook:audiobooks (
          id, title, title_bengali, slug, narrator_name, description, short_description,
          cover_image_url, language, category_id, tier_requirement, is_featured,
          total_duration_seconds, rating_average, ratings_count, tags,
          author:authors (name, slug),
          category:categories (name, slug),
          chapters (id, chapter_number, title, duration_seconds, is_preview)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    savedBooks = (rows || [])
      .filter((r) => r.audiobook)
      .map((r) => mapAudiobookRecord(r.audiobook));
  }

  return <SavedView user={user} savedBooks={savedBooks} />;
}

export default function SavedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs uppercase text-muted-foreground">
          Loading saved shelf...
        </div>
      }
    >
      <SavedDataLoader />
    </Suspense>
  );
}
