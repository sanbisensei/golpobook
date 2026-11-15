"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Sliders,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatChapterDuration } from "@/lib/audiobook-utils";

export function InspectorPlayer({ book }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0x");
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [streamError, setStreamError] = useState(null); // { type: 'AUTH_REQUIRED' | 'UPGRADE_REQUIRED' | 'GENERIC', message }
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  const chapters = book?.chapters && book.chapters.length > 0 ? book.chapters : [];
  const currentChapter = chapters[activeChapterIndex] || null;

  const [prevBookId, setPrevBookId] = useState(book?.id);
  if (book?.id !== prevBookId) {
    setPrevBookId(book?.id);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setActiveChapterIndex(0);
    setStreamError(null);
  }

  // Pause previous audio when active book changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [book?.id]);

  // Load and play audio stream for a specific chapter
  const loadAndPlayChapter = useCallback(async (chapter, autoPlay = true) => {
    if (!chapter) return;
    setIsLoading(true);
    setStreamError(null);

    try {
      const response = await fetch("/api/audio/stream-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        setIsPlaying(false);
        setStreamError({
          type: data.error || "GENERIC_ERROR",
          message: data.message || "Unable to play this chapter.",
          requiredTier: data.requiredTier,
        });
        return;
      }

      if (audioRef.current && data.streamUrl) {
        audioRef.current.src = data.streamUrl;
        audioRef.current.playbackRate = parseFloat(playbackSpeed) || 1.0;
        audioRef.current.load();

        if (autoPlay) {
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (playErr) {
            console.warn("Autoplay blocked or playback interrupted:", playErr);
            setIsPlaying(false);
          }
        }
      }
    } catch (err) {
      console.error("Stream loading error:", err);
      setStreamError({
        type: "NETWORK_ERROR",
        message: "Failed to connect to audio service.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [playbackSpeed]);

  // Handle Play/Pause button toggle
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If audio is already loaded and paused, resume playback
    if (audioRef.current.src && audioRef.current.src !== window.location.href) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Playback resume error:", err);
      }
      return;
    }

    // Otherwise, fetch stream URL for active chapter and play
    if (currentChapter) {
      await loadAndPlayChapter(currentChapter, true);
    }
  };

  // Chapter selection from tracklist
  const handleSelectChapter = async (index) => {
    if (index === activeChapterIndex && isPlaying) return;
    setActiveChapterIndex(index);
    const chapter = chapters[index];
    if (chapter) {
      await loadAndPlayChapter(chapter, true);
    }
  };

  // Skip Forward 15 seconds
  const handleSkipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      duration || 9999,
      audioRef.current.currentTime + 15
    );
  };

  // Replay Backward 15 seconds
  const handleSkipBack = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
  };

  // Next Chapter
  const handleNextChapter = () => {
    if (activeChapterIndex < chapters.length - 1) {
      handleSelectChapter(activeChapterIndex + 1);
    }
  };

  // Previous Chapter
  const handlePrevChapter = () => {
    if (activeChapterIndex > 0) {
      handleSelectChapter(activeChapterIndex - 1);
    }
  };

  // Playback speed cycle: 1.0x -> 1.25x -> 1.5x -> 2.0x
  const toggleSpeed = () => {
    const speeds = ["1.0x", "1.25x", "1.5x", "2.0x"];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(nextSpeed);
    }
  };

  // Audio Progress Bar click/scrub
  const handleScrub = (e) => {
    if (!audioRef.current || !progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    audioRef.current.currentTime = percentage * duration;
    setCurrentTime(percentage * duration);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!book) return null;

  return (
    <aside className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l-[1.5px] border-ink p-5 lg:p-6 flex flex-col justify-start select-none overflow-y-auto">
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          handleNextChapter();
        }}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />

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
        <div className="w-24 sm:w-28 aspect-[2/3] relative bg-muted border-[1.5px] border-ink rounded-lg overflow-hidden shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-hard-sm transition-all duration-200 shrink-0">
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="120px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="inline-block px-1.5 py-0.5 bg-canary text-ink border border-ink rounded-md font-mono text-[9px] font-bold uppercase tracking-wider mb-1">
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

      {/* Stream Authorization Warning Banner */}
      {streamError && (
        <div className="mt-4 p-3.5 border-[1.5px] border-ink rounded-xl bg-amber-50 dark:bg-amber-950/40 shadow-hard-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            {streamError.type === "AUTH_REQUIRED" ? (
              <Lock className="size-4 text-terracotta shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="size-4 text-terracotta shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h5 className="font-heading text-xs font-bold text-ink dark:text-foreground uppercase">
                {streamError.type === "AUTH_REQUIRED" ? "Sign In Required" : "Subscription Required"}
              </h5>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {streamError.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {streamError.type === "AUTH_REQUIRED" ? (
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
                Upgrade to {streamError.requiredTier?.toUpperCase() || "PLUS"}
              </Link>
            )}
            <button
              onClick={() => setStreamError(null)}
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
              {currentChapter ? `CH ${currentChapter.chapter_number}: ${currentChapter.title}` : "READY"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleSpeed}
              className="px-2 py-0.5 border-[1.5px] border-ink bg-muted rounded-md font-sans text-[10px] font-bold uppercase hover:bg-canary shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer"
              title="Toggle Playback Speed"
            >
              {playbackSpeed}
            </button>
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="size-6 flex items-center justify-center border-[1.5px] border-ink bg-muted rounded-md hover:bg-canary shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
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
              <span className={`w-0.5 bg-ink transition-all ${isPlaying ? "h-2.5 animate-pulse" : "h-1"}`} />
              <span className={`w-0.5 bg-terracotta transition-all ${isPlaying ? "h-3 animate-pulse" : "h-2"}`} />
              <span className={`w-0.5 bg-ink transition-all ${isPlaying ? "h-1.5" : "h-1"}`} />
              <span className={`w-0.5 bg-terracotta transition-all ${isPlaying ? "h-3.5 animate-pulse" : "h-2"}`} />
              <span className={`w-0.5 bg-ink transition-all ${isPlaying ? "h-2" : "h-1"}`} />
            </div>

            <span>
              {duration > 0
                ? formatChapterDuration(Math.floor(duration))
                : currentChapter
                ? formatChapterDuration(currentChapter.duration_seconds)
                : book.chapterDuration || "00:00"}
            </span>
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <button
            onClick={handlePrevChapter}
            disabled={activeChapterIndex === 0}
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground rounded-lg hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous Chapter"
          >
            <SkipBack className="size-4" />
          </button>

          <button
            onClick={handleSkipBack}
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground rounded-lg hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer"
            title="Replay 15s"
          >
            <RotateCcw className="size-4" />
          </button>

          <button
            onClick={togglePlayPause}
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
            onClick={handleSkipForward}
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground rounded-lg hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer"
            title="Skip 15s"
          >
            <RotateCcw className="size-4 rotate-180" />
          </button>

          <button
            onClick={handleNextChapter}
            disabled={activeChapterIndex >= chapters.length - 1}
            className="size-9 border-[1.5px] border-ink bg-muted text-foreground rounded-lg hover:bg-canary hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Next Chapter"
          >
            <SkipForward className="size-4" />
          </button>
        </div>
      </div>

      {/* Triple Segmented Utility Strip */}
      <div className="mt-4 grid grid-cols-3 border-[1.5px] border-ink bg-card rounded-lg overflow-hidden text-center text-xs divide-x-[1.5px] divide-ink shadow-hard-xs hover:shadow-hard-sm transition-all duration-150">
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
                    ) : book.tier !== "free" ? (
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
          {book.synopsis}
        </p>
      </div>
    </aside>
  );
}
