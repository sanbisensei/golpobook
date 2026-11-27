"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Compass } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { NavigationRail } from "@/components/layout/navigation-rail";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AudiobookCard } from "@/components/cards/audiobook-card";
import { InspectorPlayer } from "@/components/audio/inspector-player";
import { useAudio } from "@/context/audio-context";

export function SavedView({ user, savedBooks = [] }) {
  const audio = useAudio();
  const [selectedBook, setSelectedBook] = useState(
    savedBooks[0] || audio?.activeBook || null
  );

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <TopHeader />
      <NavigationRail />

      <div className="md:pl-20 min-h-screen pt-16 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-10 overflow-y-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink pb-4">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-canary text-ink flex items-center justify-center border-[1.5px] border-ink rounded-lg shadow-hard-2xs">
                  <Bookmark className="size-5 fill-terracotta text-terracotta" />
                </div>
                <div>
                  <h1 className="font-heading text-xl md:text-2xl font-bold uppercase tracking-tight">
                    Saved Shelf
                  </h1>
                  <p className="font-mono text-xs text-muted-foreground">
                    Audiobooks and podcasts you bookmarked for later
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs text-muted-foreground">
                {savedBooks.length} saved
              </span>
            </div>

            {!user ? (
              <div className="border-[1.5px] border-ink bg-card p-8 rounded-xl shadow-hard-xs text-center space-y-3">
                <p className="font-mono text-xs text-muted-foreground">
                  Sign in to view and sync your saved shelf.
                </p>
                <Link
                  href="/login?redirectTo=/saved"
                  className="inline-block px-4 py-2 rounded-lg bg-terracotta text-white border-[1.5px] border-ink font-sans text-xs font-bold uppercase shadow-hard-2xs"
                >
                  Sign In
                </Link>
              </div>
            ) : savedBooks.length === 0 ? (
              <div className="border-[1.5px] border-ink bg-card p-8 rounded-xl shadow-hard-xs text-center space-y-3">
                <Compass className="size-8 text-muted-foreground mx-auto" />
                <p className="font-mono text-xs text-muted-foreground">
                  Your saved shelf is empty. Click <strong>Save</strong> in the player to bookmark any title.
                </p>
                <Link
                  href="/audiobooks"
                  className="inline-block px-4 py-2 rounded-lg bg-terracotta text-white border-[1.5px] border-ink font-sans text-xs font-bold uppercase shadow-hard-2xs"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {savedBooks.map((book) => (
                  <AudiobookCard
                    key={book.id}
                    book={book}
                    isSelected={selectedBook?.id === book.id}
                    onSelect={(b) => {
                      setSelectedBook(b);
                      audio?.selectBook(b, true);
                    }}
                  />
                ))}
              </div>
            )}
          </main>

          {selectedBook && <InspectorPlayer book={selectedBook} />}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
