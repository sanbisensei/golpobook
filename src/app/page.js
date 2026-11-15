"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Bookmark,
  ChevronRight,
  TrendingUp,
  Headphones,
  Radio,
  Clock,
  Compass
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { NavigationRail } from "@/components/layout/navigation-rail";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AudiobookCard } from "@/components/cards/audiobook-card";
import { InspectorPlayer } from "@/components/audio/inspector-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLACEHOLDER_AUDIOBOOKS, CATEGORIES } from "@/lib/data/mock-catalog";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("Everything");
  const [selectedBook, setSelectedBook] = useState(PLACEHOLDER_AUDIOBOOKS[1]); // Default to "Chander Pahar"

  const filteredBooks =
    selectedCategory === "Everything"
      ? PLACEHOLDER_AUDIOBOOKS
      : PLACEHOLDER_AUDIOBOOKS.filter((b) =>
          selectedCategory === "Audiobooks"
            ? true
            : b.category.toLowerCase().includes(selectedCategory.toLowerCase())
        );

  const featuredBook = PLACEHOLDER_AUDIOBOOKS[1];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* 1. Top Fixed Navigation Header */}
      <TopHeader />

      {/* 2. Left Fixed Navigation Rail (Desktop) */}
      <NavigationRail />

      {/* 3. Main Page Shell with 3-tier Desktop Layout */}
      <div className="md:pl-20 min-h-screen pt-16 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Main Browse Canvas */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Category Pill Strip */}
            <section className="mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider border-[1.5px] border-ink transition-all duration-150 ease-out shrink-0 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                        isActive
                          ? "bg-terracotta text-white shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
                          : "bg-card text-foreground hover:bg-muted shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Featured Editorial Spotlight Banner */}
            <section className="mb-8">
              <div className="border-[1.5px] border-ink bg-card p-5 md:p-6 shadow-hard-md hover:shadow-hard-lg transition-all duration-200 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-32 md:w-44 aspect-[2/3] relative bg-muted border-[1.5px] border-ink shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-hard-sm transition-all duration-200 shrink-0">
                  <Image
                    src={featuredBook.coverUrl}
                    alt={featuredBook.title}
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary">EDITORIAL CHOICE</Badge>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-start justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs uppercase tracking-wider text-terracotta font-bold">
                      Audiobook of the Week
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {featuredBook.duration}
                    </span>
                  </div>

                  <h2 className="font-heading text-xl md:text-3xl font-bold tracking-tight text-foreground">
                    {featuredBook.title}
                  </h2>

                  <p className="font-mono text-xs md:text-sm text-muted-foreground mt-1">
                    Written by{" "}
                    <span className="text-foreground font-semibold">
                      {featuredBook.author}
                    </span>{" "}
                    | Narrated by{" "}
                    <span className="text-foreground font-semibold">
                      {featuredBook.narrator}
                    </span>
                  </p>

                  <p className="font-mono text-xs leading-relaxed text-muted-foreground mt-3 max-w-xl line-clamp-3">
                    {featuredBook.synopsis}
                  </p>

                  <div className="flex items-center gap-3 mt-4 pt-2">
                    <Button
                      onClick={() => setSelectedBook(featuredBook)}
                      variant="primary"
                      size="default"
                      className="gap-2"
                    >
                      <Play className="size-4 fill-white" />
                      <span>Start Chapter 1</span>
                    </Button>

                    <Button
                      onClick={() => setSelectedBook(featuredBook)}
                      variant="outline"
                      size="default"
                      className="gap-2"
                    >
                      <Bookmark className="size-4" />
                      <span>Add to Shelf</span>
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Popular Audiobooks Grid */}
            <section className="mb-10">
              <div className="flex items-baseline justify-between mb-4 border-b-[1.5px] border-ink pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-terracotta" />
                  <h3 className="font-heading text-base md:text-lg font-bold tracking-tight text-foreground uppercase">
                    Popular in Bangladesh
                  </h3>
                </div>
                <Link
                  href="/audiobooks"
                  className="font-mono text-xs text-muted-foreground hover:text-terracotta underline underline-offset-4 tracking-wider"
                >
                  view all (24)
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {filteredBooks.slice(0, 4).map((book) => (
                  <AudiobookCard
                    key={book.id}
                    book={book}
                    isSelected={selectedBook?.id === book.id}
                    onSelect={(b) => setSelectedBook(b)}
                  />
                ))}
              </div>
            </section>

            {/* AI Story Discovery Banner */}
            <section className="mb-10">
              <div className="border-[1.5px] border-ink bg-canary p-5 md:p-6 shadow-hard-md hover:shadow-hard-lg transition-all duration-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="size-10 bg-terracotta text-white flex items-center justify-center border-[1.5px] border-ink shadow-hard-xs shrink-0 mt-0.5">
                    <Sparkles className="size-5 fill-white" />
                  </div>
                  <div>
                    <h4 className="font-heading text-base md:text-lg font-bold text-ink">
                      Can’t decide what to listen to?
                    </h4>
                    <p className="font-mono text-xs text-ink-muted mt-0.5">
                      Tell our AI Story Finder in plain Bangla or Banglish:{" "}
                      <span className="font-semibold underline">
                        “amar voyer golpo shunte mon chacche”
                      </span>
                    </p>
                  </div>
                </div>

                <Link
                  href="/story-finder"
                  className="w-full sm:w-auto px-5 py-2.5 bg-terracotta text-white font-sans text-xs font-bold uppercase tracking-wider border-[1.5px] border-ink shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 text-center shrink-0"
                >
                  Try Story Finder
                </Link>
              </div>
            </section>

            {/* Recommended Audiobooks Grid */}
            <section className="mb-10">
              <div className="flex items-baseline justify-between mb-4 border-b-[1.5px] border-ink pb-2">
                <div className="flex items-center gap-2">
                  <Headphones className="size-5 text-terracotta" />
                  <h3 className="font-heading text-base md:text-lg font-bold tracking-tight text-foreground uppercase">
                    Recommended For You
                  </h3>
                </div>
                <Link
                  href="/audiobooks"
                  className="font-mono text-xs text-muted-foreground hover:text-terracotta underline underline-offset-4 tracking-wider"
                >
                  more
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {filteredBooks.slice(4, 8).map((book) => (
                  <AudiobookCard
                    key={book.id}
                    book={book}
                    isSelected={selectedBook?.id === book.id}
                    onSelect={(b) => setSelectedBook(b)}
                  />
                ))}
              </div>
            </section>
          </main>

          {/* Right-Side Persistent Inspector Player (Desktop Viewports) */}
          <InspectorPlayer book={selectedBook} />
        </div>
      </div>

      {/* 4. Bottom Mobile Navigation Bar */}
      <BottomNav />
    </div>
  );
}
