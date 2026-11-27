"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Compass,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  BookOpen,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { NavigationRail } from "@/components/layout/navigation-rail";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AudiobookCard } from "@/components/cards/audiobook-card";
import { InspectorPlayer } from "@/components/audio/inspector-player";
import { Button } from "@/components/ui/button";

function GenreShelfRow({ category, books, selectedBook, onSelectBook, onSeeAll }) {
  const rowRef = useRef(null);

  const slide = (dir) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({
      left: dir === "left" ? -340 : 340,
      behavior: "smooth",
    });
  };

  if (!books || books.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-2 mb-4 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="size-2.5 bg-terracotta border border-ink rounded-sm shrink-0" />
          <h2 className="font-heading text-base md:text-lg font-bold uppercase tracking-tight text-foreground truncate">
            {category.name}
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground shrink-0">
            ({books.length})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => slide("left")}
            aria-label={`Scroll ${category.name} left`}
            className="hidden sm:flex size-7 rounded-md border-[1.5px] border-ink bg-card hover:bg-terracotta hover:text-white items-center justify-center shadow-hard-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => slide("right")}
            aria-label={`Scroll ${category.name} right`}
            className="hidden sm:flex size-7 rounded-md border-[1.5px] border-ink bg-card hover:bg-terracotta hover:text-white items-center justify-center shadow-hard-2xs transition-colors cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onSeeAll(category.slug)}
            className="px-2.5 py-1 rounded-md border-[1.5px] border-ink bg-canary/60 hover:bg-canary font-mono text-[10px] font-bold uppercase tracking-wider text-ink cursor-pointer transition-colors"
          >
            See All
          </button>
        </div>
      </div>

      {/* Horizontal Spotify/Webtoon Style Shelf */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth"
      >
        {books.map((book) => (
          <div key={book.id} className="w-36 sm:w-40 md:w-44 shrink-0">
            <AudiobookCard
              book={book}
              isSelected={selectedBook?.id === book.id}
              onSelect={onSelectBook}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function BrowseCatalog({ initialCategories = [], initialAudiobooks = [] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "all";

  const [localQuery, setLocalQuery] = useState(urlQuery);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(urlCategory);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedBook, setSelectedBook] = useState(
    initialAudiobooks.find((b) => b.isFeatured) || initialAudiobooks[0] || null
  );

  // Keep state synced when header search updates URL params
  const [prevUrlParams, setPrevUrlParams] = useState(`${urlQuery}|${urlCategory}`);
  const currentUrlParams = `${urlQuery}|${urlCategory}`;
  if (currentUrlParams !== prevUrlParams) {
    setPrevUrlParams(currentUrlParams);
    setLocalQuery(urlQuery);
    setSelectedCategorySlug(urlCategory);
  }

  const updateCategoryFilter = (slug) => {
    setSelectedCategorySlug(slug);
    const params = new URLSearchParams();
    if (localQuery.trim()) params.set("q", localQuery.trim());
    if (slug && slug !== "all") params.set("category", slug);
    const qs = params.toString();
    router.replace(qs ? `/audiobooks?${qs}` : "/audiobooks", { scroll: false });
  };

  // Filter audiobooks against search query, category, language, and tier
  const filteredBooks = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    return initialAudiobooks.filter((b) => {
      const matchesCategory =
        selectedCategorySlug === "all" || b.categorySlug === selectedCategorySlug;
      const matchesLanguage =
        selectedLanguage === "all" || b.language === selectedLanguage;
      const matchesTier =
        selectedTier === "all" || b.tier === selectedTier;
      const matchesQuery =
        !q ||
        b.title?.toLowerCase().includes(q) ||
        b.titleBengali?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.narrator?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        (b.tags || []).some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesLanguage && matchesTier && matchesQuery;
    });
  }, [initialAudiobooks, localQuery, selectedCategorySlug, selectedLanguage, selectedTier]);

  const isFilteredView =
    Boolean(localQuery.trim()) ||
    selectedCategorySlug !== "all" ||
    selectedLanguage !== "all" ||
    selectedTier !== "all";

  const resetAllFilters = () => {
    setLocalQuery("");
    setSelectedCategorySlug("all");
    setSelectedLanguage("all");
    setSelectedTier("all");
    router.replace("/audiobooks", { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <TopHeader />
      <NavigationRail />

      <div className="md:pl-20 min-h-screen pt-16 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Main Browse Catalog Canvas */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Catalog Header & Filter Controls */}
            <section className="mb-8 border-[1.5px] border-ink bg-card p-5 rounded-xl shadow-hard-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 bg-terracotta text-white flex items-center justify-center border-[1.5px] border-ink rounded-lg shadow-hard-2xs">
                    <Compass className="size-5" />
                  </div>
                  <div>
                    <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-foreground uppercase">
                      Browse All Genres
                    </h1>
                    <p className="font-mono text-xs text-muted-foreground">
                      Explore {initialAudiobooks.length} audiobooks & podcasts across {initialCategories.length} categories
                    </p>
                  </div>
                </div>

                {isFilteredView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAllFilters}
                    className="gap-1.5"
                  >
                    <X className="size-3.5" />
                    <span>Clear Filters</span>
                  </Button>
                )}
              </div>

              {/* Search + Language + Tier Filter Bar */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    placeholder="Filter by title, author, narrator, or tag..."
                    className="w-full h-10 pl-9 pr-8 bg-background border-[1.5px] border-ink rounded-lg font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                  {localQuery && (
                    <button
                      type="button"
                      onClick={() => setLocalQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Language Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground mr-1 hidden sm:inline" />
                  {[
                    { id: "all", label: "All Lang" },
                    { id: "bangla", label: "বাংলা" },
                    { id: "english", label: "English" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`px-3 py-2 rounded-lg border-[1.5px] border-ink font-sans text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                        selectedLanguage === lang.id
                          ? "bg-terracotta text-white shadow-hard-2xs"
                          : "bg-muted/50 text-foreground hover:bg-muted"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>

                {/* Tier Filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "all", label: "All Tiers" },
                    { id: "free", label: "Free" },
                    { id: "plus", label: "Plus" },
                    { id: "premium", label: "Premium" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTier(t.id)}
                      className={`px-2.5 py-2 rounded-lg border-[1.5px] border-ink font-mono text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                        selectedTier === t.id
                          ? "bg-canary text-ink shadow-hard-2xs"
                          : "bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Genre Jump Strip */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => updateCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded-lg border-[1.5px] border-ink font-sans text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    selectedCategorySlug === "all"
                      ? "bg-ink text-white"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  All Genres
                </button>
                {initialCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => updateCategoryFilter(cat.slug)}
                    className={`px-3 py-1.5 rounded-lg border-[1.5px] border-ink font-sans text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      selectedCategorySlug === cat.slug
                        ? "bg-terracotta text-white shadow-hard-2xs"
                        : "bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Filtered Grid View vs Spotify/Webtoon Genre Shelves */}
            {isFilteredView ? (
              filteredBooks.length === 0 ? (
                <div className="border-[1.5px] border-ink bg-card p-8 text-center rounded-xl shadow-hard-xs my-8 space-y-3">
                  <BookOpen className="size-10 text-muted-foreground mx-auto" />
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    No Exact Catalog Matches
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground max-w-md mx-auto">
                    Try clearing a filter, or describe your mood in Bangla/Banglish to our semantic AI Story Finder.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button variant="outline" size="sm" onClick={resetAllFilters}>
                      Reset Filters
                    </Button>
                    <Link
                      href="/story-finder"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-terracotta text-white border-[1.5px] border-ink font-sans text-xs font-bold uppercase shadow-hard-xs hover:bg-terracotta-dark"
                    >
                      <Sparkles className="size-3.5" />
                      <span>Ask AI Story Finder</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <section className="mb-12">
                  <div className="flex items-baseline justify-between mb-4 border-b-[1.5px] border-ink pb-2">
                    <h2 className="font-heading text-base md:text-lg font-bold uppercase tracking-tight">
                      {selectedCategorySlug === "all"
                        ? "Matching Audiobooks"
                        : initialCategories.find((c) => c.slug === selectedCategorySlug)?.name || "Results"}
                    </h2>
                    <span className="font-mono text-xs text-muted-foreground">
                      {filteredBooks.length} titles
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredBooks.map((book) => (
                      <AudiobookCard
                        key={book.id}
                        book={book}
                        isSelected={selectedBook?.id === book.id}
                        onSelect={(b) => setSelectedBook(b)}
                      />
                    ))}
                  </div>
                </section>
              )
            ) : (
              /* Default Browse View: Dedicated Spotify/Webtoon-style Genre Shelves */
              <div className="pb-8">
                {initialCategories.map((cat) => {
                  const catBooks = initialAudiobooks.filter(
                    (b) => b.categorySlug === cat.slug
                  );
                  return (
                    <GenreShelfRow
                      key={cat.id}
                      category={cat}
                      books={catBooks}
                      selectedBook={selectedBook}
                      onSelectBook={(b) => setSelectedBook(b)}
                      onSeeAll={(slug) => updateCategoryFilter(slug)}
                    />
                  );
                })}
              </div>
            )}
          </main>

          {/* Right Docked Inspector Player */}
          <InspectorPlayer book={selectedBook} />
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
