"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Bookmark,
  Share2,
  Clock,
  Sliders,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function InspectorPlayer({ book, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0x");

  if (!book) return null;

  const toggleSpeed = () => {
    const speeds = ["1.0x", "1.25x", "1.5x", "2.0x"];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  return (
    <aside className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l-[1.5px] border-ink p-5 lg:p-6 flex flex-col justify-start select-none overflow-y-auto">
      {/* Inspector Header */}
      <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 bg-terracotta border border-ink" />
          <span className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
            Active Audiobook
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {book.tier === "premium" && (
            <Badge variant="premium">PREMIUM ONLY</Badge>
          )}
          {book.tier === "plus" && (
            <Badge variant="plus">PLUS TIER</Badge>
          )}
          {book.tier === "free" && (
            <Badge variant="free">FREE STREAM</Badge>
          )}
        </div>
      </div>

      {/* Book Cover and Quick Info */}
      <div className="flex gap-4 items-start">
        <div className="w-24 sm:w-28 aspect-[2/3] relative bg-muted border-[1.5px] border-ink shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-hard-sm transition-all duration-200 shrink-0">
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="120px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="inline-block px-1.5 py-0.5 bg-canary text-ink border border-ink font-mono text-[9px] font-bold uppercase tracking-wider mb-1">
            {book.category}
          </div>
          <h2 className="font-heading text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2">
            {book.title}
          </h2>
          <p className="font-mono text-xs text-muted-foreground mt-1 truncate">
            By: <span className="text-foreground font-semibold underline">{book.author}</span>
          </p>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate">
            Narrator: <span className="text-foreground font-medium">{book.narrator}</span>
          </p>
        </div>
      </div>

      {/* Retro-Editorial Hardware Player Container */}
      <div className="mt-5 border-[1.5px] border-ink bg-card p-4 shadow-hard-sm hover:shadow-hard-md transition-all duration-200 flex flex-col gap-3">
        {/* Top Channel Bar */}
        <div className="flex items-center justify-between border-b border-ink/20 pb-2.5">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <span className="size-2 bg-terracotta border border-ink inline-block" />
            <span className="font-sans text-[11px] uppercase tracking-wider text-foreground font-bold truncate">
              {book.currentChapter || "CHAPTER 1"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleSpeed}
              className="px-2 py-0.5 border-[1.5px] border-ink bg-muted font-sans text-[10px] font-bold uppercase hover:bg-canary shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer"
              title="Toggle Playback Speed"
            >
              {playbackSpeed}
            </button>
            <button
              className="size-6 flex items-center justify-center border-[1.5px] border-ink bg-muted hover:bg-canary shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer"
              title="Hardware Equalizer (Visual)"
            >
              <Sliders className="size-3" />
            </button>
          </div>
        </div>

        {/* Audio Progress Scrubber */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="relative w-full h-3 bg-muted border-[1.5px] border-ink flex items-center cursor-pointer group">
            <div className="h-full bg-terracotta relative" style={{ width: "35%" }}>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-3.5 bg-card border-[1.5px] border-ink shadow-hard-2xs group-hover:scale-125 transition-transform" />
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground pt-0.5">
            <span>08:42</span>

            {/* Hardware Equalizer Bars */}
            <div className="flex items-end gap-1 h-3 px-2">
              <span className={`w-0.5 bg-ink transition-all ${isPlaying ? "h-2.5 animate-pulse" : "h-1"}`} />
              <span className={`w-0.5 bg-terracotta transition-all ${isPlaying ? "h-3 animate-pulse" : "h-2"}`} />
              <span className={`w-0.5 bg-ink transition-all ${isPlaying ? "h-1.5" : "h-1"}`} />
              <span className={`w-0.5 bg-terracotta transition-all ${isPlaying ? "h-3.5 animate-pulse" : "h-2"}`} />
              <span className={`w-0.5 bg-ink transition-all ${isPlaying ? "h-2" : "h-1"}`} />
            </div>

            <span>{book.chapterDuration || "28:15"}</span>
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <button
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer"
            title="Previous Chapter"
          >
            <SkipBack className="size-4" />
          </button>

          <button
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer"
            title="Replay 15s"
          >
            <RotateCcw className="size-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 h-10 px-4 bg-terracotta text-white border-[1.5px] border-ink font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-terracotta-dark shadow-hard-xs hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer"
            title="Play / Pause"
          >
            {isPlaying ? (
              <>
                <Pause className="size-4 fill-white" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="size-4 fill-white ml-0.5" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer"
            title="Next Chapter"
          >
            <SkipForward className="size-4" />
          </button>
        </div>
      </div>

      {/* Triple Segmented Utility Strip */}
      <div className="mt-4 grid grid-cols-3 border-[1.5px] border-ink bg-card text-center text-xs divide-x-[1.5px] divide-ink shadow-hard-xs hover:shadow-hard-sm transition-all duration-150">
        <button className="py-2 hover:bg-muted font-sans font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors active:bg-muted/80">
          <Bookmark className="size-3.5" />
          <span>Save</span>
        </button>
        <button className="py-2 hover:bg-muted font-sans font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors active:bg-muted/80">
          <Clock className="size-3.5" />
          <span>Timer</span>
        </button>
        <button className="py-2 hover:bg-muted font-sans font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors active:bg-muted/80">
          <Share2 className="size-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* Chapter Index Section */}
      <div className="mt-6 flex flex-col">
        <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-2 mb-3">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
            Chapters Tracklist
          </h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            5 Chapters Total
          </span>
        </div>

        <div className="flex flex-col divide-y-[1.5px] divide-ink/15 border-[1.5px] border-ink bg-card shadow-hard-xs">
          {[
            { num: 1, title: "The Discovery & The Omen", duration: "24:10", status: "completed" },
            { num: 2, title: "Trek to the Unknown", duration: "28:15", status: "active" },
            { num: 3, title: "The Midnight Encounter", duration: "31:40", status: "locked" },
            { num: 4, title: "Shadows of the African Peak", duration: "26:50", status: "locked" },
            { num: 5, title: "The Final Cave of Gems", duration: "33:05", status: "locked" },
          ].map((ch) => (
            <div
              key={ch.num}
              className={`p-2.5 flex items-center justify-between text-xs transition-all duration-150 cursor-pointer ${
                ch.status === "active"
                  ? "bg-terracotta/10 font-bold border-l-4 border-l-terracotta"
                  : "hover:bg-muted/60 hover:translate-x-0.5"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {ch.status === "completed" ? (
                  <CheckCircle2 className="size-3.5 text-ink shrink-0" />
                ) : ch.status === "locked" ? (
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <span className="size-2 bg-terracotta inline-block shrink-0" />
                )}
                <span className="truncate font-sans text-xs">
                  {ch.num}. {ch.title}
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                {ch.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Book Synopsis */}
      <div className="mt-6">
        <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground mb-2">
          Synopsis & Specs
        </h4>
        <p className="font-mono text-xs leading-relaxed text-muted-foreground bg-muted/40 p-3 border-[1.5px] border-ink shadow-hard-xs">
          {book.synopsis}
        </p>
      </div>
    </aside>
  );
}
