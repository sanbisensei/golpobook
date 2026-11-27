"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Bookmark,
  Star,
  Clock,
  Globe,
  Calendar,
  ChevronLeft,
  Headphones,
  Share2,
  Check,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { NavigationRail } from "@/components/layout/navigation-rail";
import { BottomNav } from "@/components/layout/bottom-nav";
import { InspectorPlayer } from "@/components/audio/inspector-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatChapterDuration } from "@/lib/audiobook-utils";
import { useAudio } from "@/context/audio-context";

export function BookDetailView({ book }) {
  const [selectedBook, setSelectedBook] = useState(book);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const audio = useAudio();

  if (!book) return null;

  const handlePlayChapter = async (idx = 0) => {
    setSelectedBook({ ...book });
    if (audio) {
      await audio.selectBook(book, false);
      await audio.selectChapter(idx);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audiobookId: book.id }),
      });
      if (res.status === 401 && audio) {
        audio.setStreamError({
          type: "AUTH_REQUIRED",
          message: "Sign in to save audiobooks to your library.",
        });
      } else if (res.ok) {
        const d = await res.json();
        setSaved(Boolean(d.bookmarked));
      }
    } catch {}
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/audiobooks/${book.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <TopHeader />
      <NavigationRail />

      <div className="md:pl-20 min-h-screen pt-16 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Main Detail Canvas */}
          <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-xs font-mono text-muted-foreground">
              <Link
                href="/"
                className="hover:text-terracotta flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="size-3.5" />
                <span>Browse</span>
              </Link>
              <span>/</span>
              <Link href="/audiobooks" className="hover:text-terracotta transition-colors">
                Audiobooks
              </Link>
              <span>/</span>
              <span className="text-foreground font-semibold truncate max-w-[200px]">
                {book.title}
              </span>
            </div>

            {/* Book Hero Card */}
            <section className="border-[1.5px] border-ink bg-card p-6 md:p-8 rounded-xl shadow-hard-md mb-8">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                {/* Cover Image Mount */}
                <div className="w-40 sm:w-52 aspect-[2/3] relative bg-muted border-[1.5px] border-ink rounded-lg overflow-hidden shadow-hard-sm shrink-0">
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 160px, 208px"
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    {book.tier === "premium" && (
                      <Badge variant="premium">PREMIUM</Badge>
                    )}
                    {book.tier === "plus" && (
                      <Badge variant="plus">PLUS TIER</Badge>
                    )}
                    {book.tier === "free" && (
                      <Badge variant="free">FREE STREAM</Badge>
                    )}
                  </div>
                </div>

                {/* Metadata Column */}
                <div className="flex-1 flex flex-col items-start justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-0.5 bg-canary text-ink border border-ink rounded-md font-mono text-[10px] font-bold uppercase tracking-wider">
                      {book.category}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="size-3" />
                      <span className="uppercase">{book.language}</span>
                    </span>
                  </div>

                  <h1 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                    {book.title}
                  </h1>

                  {book.titleBengali && (
                    <h2 className="font-bengali text-lg sm:text-2xl text-terracotta font-medium mt-1">
                      {book.titleBengali}
                    </h2>
                  )}

                  <p className="font-mono text-xs sm:text-sm text-muted-foreground mt-2">
                    Written by{" "}
                    <span className="text-foreground font-bold underline">
                      {book.author}
                    </span>{" "}
                    • Narrated by{" "}
                    <span className="text-foreground font-semibold">
                      {book.narrator}
                    </span>
                  </p>

                  {/* Stat Pills */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 py-2 border-y border-ink/20 w-full text-xs font-mono">
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-amber text-ink" />
                      <span className="font-bold text-foreground">{book.rating}</span>
                      <span className="text-muted-foreground">({book.reviewsCount} reviews)</span>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>{book.duration}</span>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Headphones className="size-3.5" />
                      <span>{book.chapters.length} Chapters</span>
                    </div>

                    {book.publicationYear && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span>Published {book.publicationYear}</span>
                      </div>
                    )}
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 mt-6">
                    <Button
                      onClick={() => handlePlayChapter(0)}
                      variant="primary"
                      size="default"
                      className="gap-2 shadow-hard-xs hover:shadow-hard-sm cursor-pointer"
                    >
                      <Play className="size-4 fill-white" />
                      <span>Listen to Chapter 1</span>
                    </Button>

                    <Button
                      onClick={handleBookmark}
                      variant="outline"
                      size="default"
                      className="gap-2 shadow-hard-xs hover:shadow-hard-sm cursor-pointer"
                    >
                      <Bookmark className={`size-4 ${saved ? "fill-terracotta text-terracotta" : ""}`} />
                      <span>{saved ? "Saved in Library" : "Add to Library"}</span>
                    </Button>

                    <Button
                      onClick={handleShare}
                      variant="ghost"
                      size="default"
                      className="gap-2 cursor-pointer"
                    >
                      {copied ? <Check className="size-4 text-emerald-600" /> : <Share2 className="size-4" />}
                      <span>{copied ? "Copied" : "Share"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Synopsis Section */}
            <section className="mb-8 border-[1.5px] border-ink bg-card p-6 rounded-xl shadow-hard-sm">
              <h3 className="font-heading text-base font-bold uppercase tracking-wider text-foreground mb-3 border-b border-ink/20 pb-2">
                Editorial Synopsis
              </h3>
              <p className="font-mono text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {book.synopsis}
              </p>

              {book.tags && book.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-ink/10">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-muted text-foreground border border-ink/30 rounded-md font-mono text-[10px] uppercase"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Chapters Tracklist Section */}
            <section className="mb-10 border-[1.5px] border-ink bg-card p-6 rounded-xl shadow-hard-sm">
              <div className="flex items-center justify-between border-b border-ink/20 pb-3 mb-4">
                <h3 className="font-heading text-base font-bold uppercase tracking-wider text-foreground">
                  Tracklist & Chapters
                </h3>
                <span className="font-mono text-xs text-muted-foreground">
                  {book.chapters.length} Tracks ({book.duration})
                </span>
              </div>

              {book.chapters.length === 0 ? (
                <div className="p-6 text-center font-mono text-xs text-muted-foreground rounded-lg">
                  No chapters uploaded for this audiobook yet.
                </div>
              ) : (
                <div className="flex flex-col divide-y-[1.5px] divide-ink/15 border-[1.5px] border-ink rounded-lg overflow-hidden">
                  {book.chapters.map((ch, idx) => (
                    <div
                      key={ch.id || idx}
                      className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors group cursor-pointer"
                      onClick={() => handlePlayChapter(idx)}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <span className="font-mono text-xs font-bold text-muted-foreground w-6 text-right shrink-0">
                          {ch.chapter_number.toString().padStart(2, "0")}
                        </span>

                        <div className="size-8 bg-terracotta/10 text-terracotta border border-ink/30 rounded-md flex items-center justify-center shrink-0 group-hover:bg-terracotta group-hover:text-white transition-colors">
                          <Play className="size-3.5 fill-current ml-0.5" />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="font-sans text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-terracotta transition-colors">
                            {ch.title}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {formatChapterDuration(ch.duration_seconds)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ch.is_preview ? (
                          <span className="px-2 py-0.5 bg-canary text-ink border border-ink rounded-md font-mono text-[9px] font-bold uppercase tracking-wider">
                            PREVIEW FREE
                          </span>
                        ) : book.tier !== "free" ? (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-ink/30 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider">
                            {book.tier.toUpperCase()} ONLY
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-ink/30 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider">
                            INCLUDED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>

          {/* Right-Side Persistent Inspector Player */}
          <InspectorPlayer book={selectedBook} />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
