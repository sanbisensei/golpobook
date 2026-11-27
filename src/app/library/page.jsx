import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapAudiobookRecord } from "@/lib/audiobook-utils";
import { LibraryView } from "@/components/library/library-view";

export const metadata = {
  title: "Your Library — GolpoBook",
  description: "Continue listening to your audiobooks and manage offline cached chapters.",
};

async function LibraryDataLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let historyItems = [];

  if (user) {
    const { data: rows } = await supabase
      .from("listening_history")
      .select(`
        position_seconds,
        completed,
        last_played_at,
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
      .order("last_played_at", { ascending: false })
      .limit(24);

    historyItems = (rows || [])
      .filter((r) => r.audiobook)
      .map((r) => ({
        positionSeconds: r.position_seconds || 0,
        completed: Boolean(r.completed),
        lastPlayedAt: r.last_played_at,
        book: mapAudiobookRecord(r.audiobook),
      }));
  }

  return <LibraryView user={user} historyItems={historyItems} />;
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs uppercase text-muted-foreground">
          Loading your library...
        </div>
      }
    >
      <LibraryDataLoader />
    </Suspense>
  );
}
