import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookDetailView } from "@/components/audiobooks/book-detail-view";
import { mapAudiobookRecord } from "@/lib/audiobook-utils";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("audiobooks")
    .select("title, title_bengali, short_description, author:authors(name)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!book) {
    return { title: "Audiobook Not Found — GolpoBook" };
  }

  const authorName = book.author?.name ? ` by ${book.author.name}` : "";
  return {
    title: `${book.title}${authorName} — GolpoBook`,
    description: book.short_description || `Listen to ${book.title} on GolpoBook.`,
  };
}

async function BookDataLoader({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch audiobook by slug joining author, category, and chapters
  const { data: bookData, error } = await supabase
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
      author:authors (id, name, slug, bio, born_year, died_year, era),
      category:categories (name, slug),
      chapters (id, chapter_number, title, audio_storage_path, duration_seconds, is_preview)
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !bookData) {
    notFound();
  }

  const book = mapAudiobookRecord(bookData);

  return <BookDetailView book={book} />;
}

export default function AudiobookDetailPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <div className="size-10 bg-terracotta animate-pulse border-[1.5px] border-ink shadow-hard-xs" />
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-4">
            Loading audiobook details...
          </p>
        </div>
      }
    >
      <BookDataLoader params={params} />
    </Suspense>
  );
}
