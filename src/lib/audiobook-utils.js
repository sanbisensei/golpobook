/**
 * Utility functions for formatting and normalizing audiobook data from Supabase.
 */

export function formatDurationSeconds(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`.trim();
  }
  return `${minutes}m`;
}

export function formatChapterDuration(seconds) {
  if (!seconds || seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function mapAudiobookRecord(b) {
  if (!b) return null;
  const firstChapter = b.chapters && b.chapters.length > 0 ? b.chapters[0] : null;

  return {
    id: b.id,
    title: b.title,
    titleBengali: b.title_bengali || null,
    slug: b.slug,
    author: b.author?.name || "Unknown Author",
    authorSlug: b.author?.slug || null,
    narrator: b.narrator_name,
    duration: formatDurationSeconds(b.total_duration_seconds),
    totalDurationSeconds: b.total_duration_seconds,
    rating: b.rating_average ? Number(b.rating_average).toFixed(1) : "5.0",
    reviewsCount: b.ratings_count || 0,
    coverUrl: b.cover_image_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
    category: b.category?.name || "Literature",
    categorySlug: b.category?.slug || null,
    currentChapter: firstChapter ? firstChapter.title : "Chapter 1",
    chapterDuration: firstChapter ? formatChapterDuration(firstChapter.duration_seconds) : "25:00",
    tier: b.tier_requirement,
    isFeatured: b.is_featured,
    isPreview: firstChapter ? firstChapter.is_preview : true,
    synopsis: b.description || b.short_description,
    shortDescription: b.short_description,
    chapters: (b.chapters || []).sort((x, y) => x.chapter_number - y.chapter_number),
    tags: b.tags || []
  };
}
