"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Play,
  ArrowRight,
  BookOpen,
  Loader2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { NavigationRail } from "@/components/layout/navigation-rail";
import { BottomNav } from "@/components/layout/bottom-nav";
import { InspectorPlayer } from "@/components/audio/inspector-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDurationSeconds } from "@/lib/audiobook-utils";

const SAMPLE_PROMPTS = [
  "amar voyer golpo shunte mon chacche",
  "ভৌতিক বা গা ছমছমে রহস্য গল্প",
  "classic bengali adventure and wilderness expedition",
  "dystopian totalitarian surveillance and thoughtcrime",
  "rural bengal childhood nostalgia and nature",
  "wandering bohemian traveler across old Bengal",
];

export default function StoryFinderPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null); // { aiMessage, books, normalizedQuery, isSemanticSearch }
  const [selectedBook, setSelectedBook] = useState(null);

  const handleSearch = async (searchPrompt) => {
    const promptToUse = searchPrompt || query;
    if (!promptToUse.trim()) return;

    setIsLoading(true);
    setQuery(promptToUse);

    try {
      const response = await fetch("/api/ai/story-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: promptToUse }),
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data);
        if (data.books && data.books.length > 0) {
          // Normalize first book for player if none selected
          const first = data.books[0];
          setSelectedBook({
            id: first.id,
            title: first.title,
            titleBengali: first.title_bengali,
            slug: first.slug,
            author: first.author_name,
            narrator: first.narrator_name,
            duration: formatDurationSeconds(first.total_duration_seconds),
            coverUrl: first.cover_image_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
            category: first.category_name,
            tier: first.tier_requirement,
            synopsis: first.short_description,
          });
        }
      } else {
        alert(data.message || "Failed to search stories.");
      }
    } catch (err) {
      console.error("Story finder client error:", err);
      alert("Network error connecting to Story Finder service.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <TopHeader />
      <NavigationRail />

      <div className="md:pl-20 min-h-screen pt-16 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Main Story Finder Canvas */}
          <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto">
            {/* Header Hero Banner */}
            <div className="mb-8 border-[1.5px] border-ink bg-canary p-6 md:p-8 rounded-xl shadow-hard-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 bg-terracotta text-white flex items-center justify-center border border-ink rounded-lg shadow-hard-2xs">
                  <Sparkles className="size-4 fill-white" />
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                  AI Story Finder • গল্প সন্ধানকারী
                </span>
              </div>

              <h1 className="font-heading text-2xl md:text-4xl font-bold text-ink tracking-tight">
                Tell Us What You Wish to Feel.
              </h1>

              <p className="font-mono text-xs md:text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">
                Describe your desired mood, atmosphere, or setting in plain{" "}
                <span className="font-bold underline text-ink">বাংলা</span>,{" "}
                <span className="font-bold underline text-ink">Banglish</span>, or{" "}
                <span className="font-bold underline text-ink">English</span>. Our semantic vector engine matches your feelings against the catalog.
              </p>

              {/* Sample Prompt Chips */}
              <div className="mt-5 pt-4 border-t border-ink/20">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink font-bold block mb-2">
                  Try asking:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSearch(prompt)}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-card hover:bg-white text-ink border-[1.5px] border-ink rounded-lg font-mono text-xs transition-all shadow-hard-2xs hover:shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer text-left"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversational Query Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="mb-8 flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. amar voyer golpo shunte mon chacche..."
                  disabled={isLoading}
                  className="w-full h-12 pl-10 pr-4 bg-card border-[1.5px] border-ink rounded-lg font-mono text-xs sm:text-sm text-foreground shadow-hard-xs focus:outline-none focus:ring-2 focus:ring-terracotta transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !query.trim()}
                variant="primary"
                size="default"
                className="h-12 px-6 gap-2 shadow-hard-xs hover:shadow-hard-sm cursor-pointer shrink-0 uppercase tracking-wider text-xs font-bold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 fill-white" />
                    <span>Find Stories</span>
                  </>
                )}
              </Button>
            </form>

            {/* Results Section */}
            {results && (
              <section className="mb-10 space-y-6">
                {/* AI Recommendation Message Card */}
                <div className="border-[1.5px] border-ink bg-card p-5 md:p-6 rounded-xl shadow-hard-sm">
                  <div className="flex items-center gap-2 mb-2 text-terracotta">
                    <Zap className="size-4 fill-terracotta" />
                    <span className="font-mono text-xs uppercase tracking-wider font-bold">
                      Curator&apos;s Recommendation
                    </span>
                  </div>

                  <p className="font-bengali text-base sm:text-lg leading-relaxed text-foreground font-medium">
                    {results.aiMessage}
                  </p>

                  {results.normalizedQuery && (
                    <div className="mt-3 pt-2 border-t border-ink/10 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                      <span className="font-bold uppercase">Semantic Tokens:</span>
                      <span className="italic truncate">{results.normalizedQuery}</span>
                    </div>
                  )}
                </div>

                {/* Matched Audiobook Cards Grid */}
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-ink/20 pb-2">
                    <h3 className="font-heading text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
                      Matched Audiobooks ({results.books?.length || 0})
                    </h3>
                    <span className="font-mono text-xs text-muted-foreground">
                      Verified Catalog Matches
                    </span>
                  </div>

                  {results.books && results.books.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {results.books.map((book) => (
                        <div
                          key={book.id}
                          className="border-[1.5px] border-ink bg-card p-4 rounded-xl shadow-hard-xs hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
                        >
                          <div>
                            <div className="aspect-[2/3] relative bg-muted border border-ink rounded-lg mb-3 overflow-hidden">
                              <Image
                                src={book.cover_image_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"}
                                alt={book.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 250px"
                                className="object-cover"
                              />
                              <div className="absolute top-2 left-2">
                                {book.tier_requirement === "premium" && (
                                  <Badge variant="premium">PREMIUM</Badge>
                                )}
                                {book.tier_requirement === "plus" && (
                                  <Badge variant="plus">PLUS</Badge>
                                )}
                                {book.tier_requirement === "free" && (
                                  <Badge variant="free">FREE</Badge>
                                )}
                              </div>
                            </div>

                            <span className="inline-block px-1.5 py-0.2 bg-muted text-foreground border border-ink/30 rounded-md font-mono text-[9px] font-bold uppercase mb-1">
                              {book.category_name}
                            </span>

                            <h4 className="font-heading text-sm font-bold text-foreground leading-snug line-clamp-1">
                              {book.title}
                            </h4>

                            {book.title_bengali && (
                              <p className="font-bengali text-xs text-terracotta line-clamp-1">
                                {book.title_bengali}
                              </p>
                            )}

                            <p className="font-mono text-[11px] text-muted-foreground mt-1 truncate">
                              By {book.author_name}
                            </p>

                            <p className="font-mono text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                              {book.short_description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-ink/15 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedBook({
                                  id: book.id,
                                  title: book.title,
                                  titleBengali: book.title_bengali,
                                  slug: book.slug,
                                  author: book.author_name,
                                  narrator: book.narrator_name,
                                  duration: formatDurationSeconds(book.total_duration_seconds),
                                  coverUrl: book.cover_image_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
                                  category: book.category_name,
                                  tier: book.tier_requirement,
                                  synopsis: book.short_description,
                                });
                              }}
                              className="flex-1 py-1.5 bg-terracotta text-white font-sans text-[11px] font-bold uppercase tracking-wider border border-ink shadow-hard-2xs hover:shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play className="size-3 fill-white" />
                              <span>Play</span>
                            </button>

                            <Link
                              href={`/audiobooks/${book.slug}`}
                              className="px-2.5 py-1.5 bg-card text-foreground hover:bg-muted font-sans text-[11px] font-bold uppercase tracking-wider border border-ink shadow-hard-2xs hover:shadow-hard-xs transition-all flex items-center justify-center cursor-pointer"
                              title="View full details"
                            >
                              <ArrowRight className="size-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center border-[1.5px] border-ink bg-card font-mono text-xs text-muted-foreground">
                      No matching audiobooks found for this mood. Try a different query.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Default State: Popular Suggestions */}
            {!results && (
              <section className="border-[1.5px] border-ink bg-card p-6 shadow-hard-xs">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="size-4 text-terracotta" />
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
                    How AI Story Finder Works
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs text-muted-foreground">
                  <div className="p-3 border border-ink/20 bg-muted/20">
                    <span className="font-bold text-foreground block mb-1">1. Express Naturally</span>
                    Speak in English, Bengali, or Banglish. No strict keywords or exact titles required.
                  </div>
                  <div className="p-3 border border-ink/20 bg-muted/20">
                    <span className="font-bold text-foreground block mb-1">2. Semantic Normalizer</span>
                    Our AI extracts your emotional intent, themes, and tone across both languages.
                  </div>
                  <div className="p-3 border border-ink/20 bg-muted/20">
                    <span className="font-bold text-foreground block mb-1">3. Zero Hallucinations</span>
                    Results are retrieved directly from verified database records. You can immediately listen to any recommendation.
                  </div>
                </div>
              </section>
            )}
          </main>

          {/* Right-Side Persistent Inspector Player */}
          {selectedBook && <InspectorPlayer book={selectedBook} />}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
