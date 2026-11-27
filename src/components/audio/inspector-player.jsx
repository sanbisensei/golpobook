"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Bookmark,
  Share2,
  Clock,
  Lock,
  Loader2,
  AlertCircle,
  Volume2,
  VolumeX,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatChapterDuration } from "@/lib/audiobook-utils";
import { useAudio } from "@/context/audio-context";

export function InspectorPlayer({ book }) {
  const audio = useAudio();
  const progressBarRef = useRef(null);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Sync incoming book prop into global AudioProvider when it changes
  useEffect(() => {
    if (book && audio && audio.activeBook?.id !== book.id && !audio.isPlaying) {
      audio.selectBook(book, false);
    }
  }, [book, audio]);

  // Display either the incoming selected book or the currently playing global book
  const displayBook = book || audio?.activeBook || null;

  // Check bookmark status when displayed book changes
  useEffect(() => {
    if (!displayBook?.id) return;
    let cancelled = false;
    fetch(`/api/bookmarks?audiobookId=${displayBook.id}`)
      .then((r) => (r.ok ? r.json() : { bookmarked: false }))
      .then((d) => {
        if (!cancelled) setIsBookmarked(Boolean(d.bookmarked));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [displayBook?.id]);

  if (!displayBook || !audio) return null;

  const isSameAsActive = audio.activeBook?.id === displayBook.id;
  const chapters =
    displayBook.chapters && displayBook.chapters.length > 0
      ? displayBook.chapters
      : [];
  const activeChapterIndex = isSameAsActive ? audio.activeChapterIndex : 0;
  const currentChapter = chapters[activeChapterIndex] || null;
  const isPlaying = isSameAsActive ? audio.isPlaying : false;
  const isLoading = isSameAsActive ? audio.isLoading : false;
  const currentTime = isSameAsActive ? audio.currentTime : 0;
  const duration = isSameAsActive ? audio.duration : 0;
  const progressPercentage =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handlePlayToggle = async () => {
    if (!isSameAsActive) {
      await audio.selectBook(displayBook, true);
    } else {
      await audio.togglePlayPause();
    }
  };

  const handleSelectChapter = async (idx) => {
    if (!isSameAsActive) {
      await audio.selectBook(displayBook, false);
    }
    await audio.selectChapter(idx);
  };

  const handleScrub = (e) => {
    if (!isSameAsActive || !progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    audio.seekToRatio(clickX / rect.width);
  };

  const handleToggleBookmark = async () => {
    if (!displayBook?.id || bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audiobookId: displayBook.id }),
      });
      const data = await res.json();
      if (res.status === 401) {
        audio.setStreamError({
          type: "AUTH_REQUIRED",
          message: data.message || "Sign in to save audiobooks to your shelf.",
        });
      } else if (res.ok) {
        setIsBookmarked(Boolean(data.bookmarked));
      }
    } catch {
      // Ignore network error
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/audiobooks/${displayBook.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const sleepLabel =
    audio.sleepMode === "end_of_chapter"
      ? "Ch End"
      : audio.sleepMode === "countdown" && audio.sleepSecondsLeft > 0
      ? formatChapterDuration(audio.sleepSecondsLeft)
      : "Timer";

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
          {displayBook.tier === "premium" && (
            <Badge variant="premium">PREMIUM ONLY</Badge>
          )}
          {displayBook.tier === "plus" && (
            <Badge variant="plus">PLUS TIER</Badge>
          )}
          {displayBook.tier === "free" && (
            <Badge variant="free">FREE STREAM</Badge>
          )}
        </div>
      </div>

      {/* Book Cover and Quick Info */}
      <div className="flex gap-4 items-start">
        <div className="w-24 sm:w-28 aspect-[2/3] relative bg-muted border-[1.5px] border-ink rounded-lg overflow-hidden shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-hard-sm transition-all duration-200 shrink-0">
          <Image
            src={displayBook.coverUrl}
            alt={displayBook.title}
            fill
            sizes="120px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="inline-block px-1.5 py-0.5 bg-canary text-ink border border-ink rounded-md font-mono text-[9px] font-bold uppercase tracking-wider mb-1">
            {displayBook.category}
          </div>
          <h2 className="font-heading text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2">
            {displayBook.title}
          </h2>
          <p className="font-mono text-xs text-muted-foreground mt-1 truncate">
            By:{" "}
            <span className="text-foreground font-semibold underline">
              {displayBook.author}
            </span>
          </p>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate">
            Narrator:{" "}
            <span className="text-foreground font-medium">
              {displayBook.narrator}
            </span>
          </p>
        </div>
      </div>

      {/* Stream Authorization Warning Banner */}
      {audio.streamError && (
        <div className="mt-4 p-3.5 border-[1.5px] border-ink rounded-xl bg-amber-50 dark:bg-amber-950/40 shadow-hard-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            {audio.streamError.type === "AUTH_REQUIRED" ? (
              <Lock className="size-4 text-terracotta shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="size-4 text-terracotta shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h5 className="font-heading text-xs font-bold text-ink dark:text-foreground uppercase">
                {audio.streamError.type === "AUTH_REQUIRED"
                  ? "Sign In Required"
                  : "Subscription Required"}
              </h5>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {audio.streamError.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {audio.streamError.type === "AUTH_REQUIRED" ? (
              <Link
                href="/login?redirectTo=/"
                className="px-3 py-1 bg-terracotta text-white font-sans text-[11px] font-bold uppercase tracking-wider border-[1.5px] border-ink rounded-lg shadow-hard-2xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                Sign In Now
              </Link>
            ) : (
              <Link
                href="/account"
                className="px-3 py-1 bg-terracotta text-white font-sans text-[11px] font-bold uppercase tracking-wider border-[1.5px] border-ink rounded-lg shadow-hard-2xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                Upgrade to{" "}
                {audio.streamError.requiredTier?.toUpperCase() || "PLUS"}
              </Link>
            )}
            <button
              onClick={() => audio.setStreamError(null)}
              className="px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Retro-Editorial Hardware Player Container */}
      <div className="mt-5 border-[1.5px] border-ink bg-card p-4 rounded-xl shadow-hard-sm hover:shadow-hard-md transition-all duration-200 flex flex-col gap-3">
        {/* Top Channel Bar */}
        <div className="flex items-center justify-between border-b border-ink/20 pb-2.5">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <span className="size-2 bg-terracotta border border-ink inline-block" />
            <span className="font-sans text-[11px] uppercase tracking-wider text-foreground font-bold truncate">
              {currentChapter
                ? `CH ${currentChapter.chapter_number}: ${currentChapter.title}`
                : "READY"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={audio.cycleSpeed}
              className="px-2 py-0.5 border-[1.5px] border-ink bg-muted rounded-md font-sans text-[10px] font-bold uppercase hover:bg-canary shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer"
              title="Toggle Playback Speed"
            >
              {audio.playbackSpeed}
            </button>
            <button
              onClick={audio.toggleMute}
              className="size-6 flex items-center justify-center border-[1.5px] border-ink bg-muted rounded-md hover:bg-canary shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer"
              title={audio.isMuted ? "Unmute" : "Mute"}
            >
              {audio.isMuted ? (
                <VolumeX className="size-3" />
              ) : (
                <Volume2 className="size-3" />
              )}
            </button>
          </div>
        </div>

        {/* Audio Progress Scrubber */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div
            ref={progressBarRef}
            onClick={handleScrub}
            className="relative w-full h-3 bg-muted border-[1.5px] border-ink rounded-full overflow-hidden flex items-center cursor-pointer group"
          >
            <div
              className="h-full bg-terracotta relative transition-all duration-75"
              style={{ width: `${progressPercentage}%` }}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-3.5 bg-card border-[1.5px] border-ink rounded-full shadow-hard-2xs group-hover:scale-125 transition-transform" />
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground pt-0.5">
            <span>{formatChapterDuration(Math.floor(currentTime))}</span>

            {/* Hardware Equalizer Bars */}
            <div className="flex items-end gap-1 h-3 px-2">
              <span
                className={`w-0.5 bg-ink transition-all ${
                  isPlaying ? "h-2.5 animate-pulse" : "h-1"
                }`}
              />
              <span
                className={`w-0.5 bg-terracotta transition-all ${
                  isPlaying ? "h-3 animate-pulse" : "h-2"
                }`}
              />
              <span
                className={`w-0.5 bg-ink transition-all ${
                  isPlaying ? "h-1.5" : "h-1"
                }`}
              />
              <span
                className={`w-0.5 bg-terracotta transition-all ${
                  isPlaying ? "h-3.5 animate-pulse" : "h-2"
                }`}
              />
              <span
                className={`w-0.5 bg-ink transition-all ${
                  isPlaying ? "h-2" : "h-1"
                }`}
              />
            </div>

            <span>
              {duration > 0
                ? formatChapterDuration(Math.floor(duration))
                : currentChapter
                ? formatChapterDuration(currentChapter.duration_seconds)
                : displayBook.chapterDuration || "00:00"}
            </span>
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <button
            onClick={() =>
              activeChapterIndex > 0 && handleSelectChapter(activeChapterIndex - 1)
            }
            disabled={activeChapterIndex === 0}
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground rounded-lg hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous Chapter"
          >
            <SkipBack className="size-4" />
          </button>

          <button
            onClick={() => audio.skipBy(-15)}
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground rounded-lg hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer"
            title="Replay 15s"
          >
            <RotateCcw className="size-4" />
          </button>

          <button
            onClick={handlePlayToggle}
            disabled={isLoading}
            className="flex-1 h-10 px-4 bg-terracotta text-white border-[1.5px] border-ink rounded-lg font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-terracotta-dark shadow-hard-xs hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer disabled:opacity-70"
            title="Play / Pause"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>LOADING...</span>
              </>
            ) : isPlaying ? (
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
            onClick={() => audio.skipBy(15)}
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground rounded-lg hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer"
            title="Skip 15s"
          >
            <RotateCcw className="size-4 rotate-180" />
          </button>

          <button
            onClick={() =>
              activeChapterIndex < chapters.length - 1 &&
              handleSelectChapter(activeChapterIndex + 1)
            }
            disabled={activeChapterIndex >= chapters.length - 1}
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground rounded-lg hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Next Chapter"
          >
            <SkipForward className="size-4" />
          </button>
        </div>
      </div>

      {/* Triple Segmented Utility Strip (Wired: Save, Sleep Timer, Share) */}
      <div className="mt-4 relative">
        <div className="grid grid-cols-3 border-[1.5px] border-ink bg-card rounded-lg overflow-hidden text-center text-xs divide-x-[1.5px] divide-ink shadow-hard-xs hover:shadow-hard-sm transition-all duration-150">
          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={bookmarkLoading}
            className={`py-2 font-sans font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              isBookmarked
                ? "bg-canary text-ink"
                : "hover:bg-muted active:bg-muted/80"
            }`}
          >
            <Bookmark
              className={`size-3.5 ${isBookmarked ? "fill-terracotta text-terracotta" : ""}`}
            />
            <span>{isBookmarked ? "Saved" : "Save"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTimerMenu((v) => !v)}
            className={`py-2 font-sans font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              audio.sleepMode
                ? "bg-terracotta/15 text-terracotta"
                : "hover:bg-muted active:bg-muted/80"
            }`}
          >
            <Clock className="size-3.5" />
            <span>{sleepLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="py-2 hover:bg-muted font-sans font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors active:bg-muted/80"
          >
            {shareCopied ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Share2 className="size-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Sleep Timer Menu */}
        {showTimerMenu && (
          <div className="mt-2 p-2.5 border-[1.5px] border-ink bg-card rounded-lg shadow-hard-sm flex items-center justify-between gap-1.5">
            {[
              { id: "off", label: "Off" },
              { id: "15", label: "15m" },
              { id: "30", label: "30m" },
              { id: "end_of_chapter", label: "Ch End" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  audio.setSleepTimer(opt.id);
                  setShowTimerMenu(false);
                }}
                className="flex-1 py-1 rounded-md border border-ink/40 hover:bg-canary font-mono text-[10px] font-bold uppercase cursor-pointer transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chapter Index Section */}
      <div className="mt-6 flex flex-col">
        <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-2 mb-3">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
            Chapters Tracklist
          </h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {chapters.length} Chapters Total
          </span>
        </div>

        {chapters.length === 0 ? (
          <div className="p-4 border-[1.5px] border-ink bg-muted/30 rounded-lg text-center font-mono text-xs text-muted-foreground">
            No audio chapters uploaded yet.
          </div>
        ) : (
          <div className="flex flex-col divide-y-[1.5px] divide-ink/15 border-[1.5px] border-ink bg-card rounded-lg overflow-hidden shadow-hard-xs">
            {chapters.map((ch, idx) => {
              const isSelected = idx === activeChapterIndex;
              return (
                <div
                  key={ch.id || idx}
                  onClick={() => handleSelectChapter(idx)}
                  className={`p-2.5 flex items-center justify-between text-xs transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-terracotta/10 font-bold border-l-4 border-l-terracotta"
                      : "hover:bg-muted/60 hover:translate-x-0.5"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {ch.is_preview ? (
                      <span className="px-1.5 py-0.2 bg-canary text-ink border border-ink rounded-md font-mono text-[9px] font-bold uppercase shrink-0">
                        PREVIEW
                      </span>
                    ) : displayBook.tier !== "free" ? (
                      <Lock className="size-3 text-muted-foreground shrink-0" />
                    ) : (
                      <span className="size-1.5 bg-ink inline-block shrink-0" />
                    )}
                    <span className="truncate font-sans text-xs">
                      {ch.chapter_number}. {ch.title}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                    {formatChapterDuration(ch.duration_seconds)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Book Synopsis */}
      <div className="mt-6">
        <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground mb-2">
          Synopsis & Specs
        </h4>
        <p className="font-mono text-xs leading-relaxed text-muted-foreground bg-muted/40 p-3 border-[1.5px] border-ink rounded-lg shadow-hard-xs">
          {displayBook.synopsis}
        </p>
      </div>
    </aside>
  );
}
