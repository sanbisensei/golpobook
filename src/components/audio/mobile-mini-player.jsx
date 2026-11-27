"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Pause, Loader2 } from "lucide-react";
import { useAudio } from "@/context/audio-context";

export function MobileMiniPlayer() {
  const audio = useAudio();
  if (!audio || !audio.activeBook) return null;

  const { activeBook, currentChapter, isPlaying, isLoading, currentTime, duration, togglePlayPause } = audio;
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 px-2 pb-1.5 pointer-events-none">
      <div className="pointer-events-auto bg-card border-[1.5px] border-ink rounded-xl shadow-hard-md overflow-hidden">
        <div className="flex items-center gap-3 p-2.5">
          <Link href={`/audiobooks/${activeBook.slug}`} className="size-10 relative rounded-md border border-ink overflow-hidden shrink-0 bg-muted">
            <Image
              src={activeBook.coverUrl}
              alt={activeBook.title}
              fill
              sizes="40px"
              className="object-cover"
            />
          </Link>

          <Link href={`/audiobooks/${activeBook.slug}`} className="flex-1 min-w-0">
            <p className="font-heading text-xs font-bold text-foreground truncate">
              {activeBook.title}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground truncate">
              {currentChapter ? `Ch ${currentChapter.chapter_number}: ${currentChapter.title}` : activeBook.author}
            </p>
          </Link>

          <button
            type="button"
            onClick={togglePlayPause}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="size-9 rounded-lg bg-terracotta text-white border-[1.5px] border-ink shadow-hard-2xs flex items-center justify-center shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="size-4 fill-white" />
            ) : (
              <Play className="size-4 fill-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Thin progress bar along bottom edge */}
        <div className="h-1 w-full bg-muted">
          <div className="h-full bg-terracotta transition-all duration-150" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
