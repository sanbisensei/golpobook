"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Library, Clock, HardDrive, Play, Trash2, Compass } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { NavigationRail } from "@/components/layout/navigation-rail";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AudiobookCard } from "@/components/cards/audiobook-card";
import { InspectorPlayer } from "@/components/audio/inspector-player";
import { useAudio } from "@/context/audio-context";
import { getAllOfflineChapters, removeOfflineChapter } from "@/lib/offline-audio";
import { formatChapterDuration } from "@/lib/audiobook-utils";

export function LibraryView({ user, historyItems = [] }) {
  const audio = useAudio();
  const [selectedBook, setSelectedBook] = useState(
    historyItems[0]?.book || audio?.activeBook || null
  );
  const [offlineItems, setOfflineItems] = useState([]);

  useEffect(() => {
    getAllOfflineChapters().then(setOfflineItems).catch(() => {});
  }, []);

  const handleRemoveOffline = async (chapterId) => {
    await removeOfflineChapter(chapterId).catch(() => {});
    setOfflineItems((prev) => prev.filter((item) => item.chapterId !== chapterId));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <TopHeader />
      <NavigationRail />

      <div className="md:pl-20 min-h-screen pt-16 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-10 overflow-y-auto space-y-10">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink pb-4">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-terracotta text-white flex items-center justify-center border-[1.5px] border-ink rounded-lg shadow-hard-2xs">
                  <Library className="size-5" />
                </div>
                <div>
                  <h1 className="font-heading text-xl md:text-2xl font-bold uppercase tracking-tight">
                    Your Library
                  </h1>
                  <p className="font-mono text-xs text-muted-foreground">
                    Continue listening across devices &amp; manage offline cached chapters
                  </p>
                </div>
              </div>

              <Link
                href="/saved"
                className="px-3.5 py-1.5 rounded-lg border-[1.5px] border-ink bg-canary/60 hover:bg-canary font-sans text-xs font-bold uppercase"
              >
                View Saved Shelf →
              </Link>
            </div>

            {/* Continue Listening */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-terracotta" />
                  <h2 className="font-heading text-base font-bold uppercase tracking-wider">
                    Continue Listening
                  </h2>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {historyItems.length} titles
                </span>
              </div>

              {!user ? (
                <div className="border-[1.5px] border-ink bg-card p-6 rounded-xl shadow-hard-xs text-center space-y-3">
                  <p className="font-mono text-xs text-muted-foreground">
                    Sign in to sync your listening progress across devices.
                  </p>
                  <Link
                    href="/login?redirectTo=/library"
                    className="inline-block px-4 py-2 rounded-lg bg-terracotta text-white border-[1.5px] border-ink font-sans text-xs font-bold uppercase shadow-hard-2xs"
                  >
                    Sign In
                  </Link>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="border-[1.5px] border-ink bg-card p-8 rounded-xl shadow-hard-xs text-center space-y-3">
                  <Compass className="size-8 text-muted-foreground mx-auto" />
                  <p className="font-mono text-xs text-muted-foreground">
                    You haven&apos;t started any audiobooks yet. Pick a story to begin!
                  </p>
                  <Link
                    href="/audiobooks"
                    className="inline-block px-4 py-2 rounded-lg bg-terracotta text-white border-[1.5px] border-ink font-sans text-xs font-bold uppercase shadow-hard-2xs"
                  >
                    Explore Catalog
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {historyItems.map((item) => (
                    <div key={item.book.id} className="space-y-1.5">
                      <AudiobookCard
                        book={item.book}
                        isSelected={selectedBook?.id === item.book.id}
                        onSelect={(b) => {
                          setSelectedBook(b);
                          audio?.selectBook(b, true);
                        }}
                      />
                      <div className="px-2 py-1 rounded-md bg-muted/60 border border-ink/20 font-mono text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>{item.completed ? "Completed" : `At ${formatChapterDuration(item.positionSeconds)}`}</span>
                        <Play className="size-2.5 text-terracotta fill-terracotta" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Offline IndexedDB Cache */}
            <section>
              <div className="flex items-center justify-between mb-4 border-b-[1.5px] border-ink pb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="size-4 text-terracotta" />
                  <h2 className="font-heading text-base font-bold uppercase tracking-wider">
                    Offline Cached Chapters (This Browser)
                  </h2>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {offlineItems.length} cached
                </span>
              </div>

              {offlineItems.length === 0 ? (
                <div className="border-[1.5px] border-ink bg-card p-6 rounded-xl font-mono text-xs text-muted-foreground">
                  No chapters cached offline yet. Plus &amp; Premium listeners can click <strong>Offline</strong> in the player to cache chapters for offline playback.
                </div>
              ) : (
                <div className="divide-y-[1.5px] divide-ink/15 border-[1.5px] border-ink bg-card rounded-xl overflow-hidden shadow-hard-xs">
                  {offlineItems.map((item) => (
                    <div key={item.chapterId} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-heading text-xs font-bold truncate">{item.title}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Cached {new Date(item.cachedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOffline(item.chapterId)}
                        className="p-1.5 rounded-md border border-ink/30 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                        title="Remove offline cache"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>

          {selectedBook && <InspectorPlayer book={selectedBook} />}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
