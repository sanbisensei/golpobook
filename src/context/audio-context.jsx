"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  getOfflineChapterBlobUrl,
  saveChapterOffline,
  isChapterCachedOffline,
  getOfflineCachedCount,
} from "@/lib/offline-audio";

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const audioRef = useRef(null);

  const [activeBook, setActiveBook] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0x");
  const [isMuted, setIsMuted] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [tierCapabilities, setTierCapabilities] = useState({
    plan: "guest",
    maxSpeed: 1.0,
    allowSleepTimer: false,
    allowFullSeeking: true,
  });

  // Sleep timer state: null | "end_of_chapter" | number (seconds remaining)
  const [sleepMode, setSleepMode] = useState(null);
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState(0);

  const lastProgressSyncRef = useRef(0);

  const chapters =
    activeBook?.chapters && activeBook.chapters.length > 0
      ? activeBook.chapters
      : [];
  const currentChapter = chapters[activeChapterIndex] || null;

  // Save playback progress to /api/audio/progress
  const syncProgress = useCallback(
    async (posSeconds, completed = false) => {
      if (!activeBook?.id || !currentChapter?.id) return;
      try {
        await fetch("/api/audio/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audiobookId: activeBook.id,
            chapterId: currentChapter.id,
            positionSeconds: Math.floor(posSeconds),
            completed,
          }),
        });
      } catch {
        // Silent fail for guest/network
      }
    },
    [activeBook, currentChapter]
  );

  // Load and play a chapter
  const loadAndPlayChapter = useCallback(
    async (book, chapterIdx, autoPlay = true, resumeAtSeconds = 0) => {
      const chList = book?.chapters || [];
      const chapter = chList[chapterIdx];
      if (!chapter) return;

      setIsLoading(true);
      setStreamError(null);

      try {
        // 1. Check IndexedDB offline cache first (REQ-30)
        const offlineUrl = await getOfflineChapterBlobUrl(chapter.id);
        if (offlineUrl && audioRef.current) {
          audioRef.current.src = offlineUrl;
          audioRef.current.playbackRate = parseFloat(playbackSpeed) || 1.0;
          audioRef.current.load();
          if (resumeAtSeconds > 0) {
            audioRef.current.currentTime = resumeAtSeconds;
            setCurrentTime(resumeAtSeconds);
          }
          if (autoPlay) {
            try {
              await audioRef.current.play();
              setIsPlaying(true);
            } catch {
              setIsPlaying(false);
            }
          }
          setIsLoading(false);
          return;
        }

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

        if (data.tierCapabilities) {
          setTierCapabilities(data.tierCapabilities);
        }

        if (audioRef.current && data.streamUrl) {
          const maxSpd = data.tierCapabilities?.maxSpeed || 1.0;
          const requestedSpd = parseFloat(playbackSpeed) || 1.0;
          const safeSpd = Math.min(requestedSpd, maxSpd);
          if (safeSpd !== requestedSpd) {
            setPlaybackSpeed(`${safeSpd.toFixed(1)}x`);
          }

          audioRef.current.src = data.streamUrl;
          audioRef.current.playbackRate = safeSpd;
          audioRef.current.load();

          if (resumeAtSeconds > 0) {
            audioRef.current.currentTime = resumeAtSeconds;
            setCurrentTime(resumeAtSeconds);
          }

          // Update browser lockscreen media controls
          if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: `${chapter.chapter_number}. ${chapter.title}`,
              artist: book.author || "GolpoBook",
              album: book.title,
              artwork: book.coverUrl
                ? [{ src: book.coverUrl, sizes: "512x512", type: "image/webp" }]
                : [],
            });
          }

          if (autoPlay) {
            try {
              await audioRef.current.play();
              setIsPlaying(true);
            } catch {
              setIsPlaying(false);
            }
          }
        }
      } catch {
        setStreamError({
          type: "NETWORK_ERROR",
          message: "Failed to connect to audio service.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [playbackSpeed]
  );

  // Select a book into the global player (without interrupting if it's already playing)
  const selectBook = useCallback(
    async (book, autoPlay = false) => {
      if (!book) return;
      if (activeBook?.id === book.id) {
        if (autoPlay && !isPlaying) {
          await loadAndPlayChapter(book, activeChapterIndex, true);
        }
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      setActiveBook(book);
      setActiveChapterIndex(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setStreamError(null);

      // Check saved progress if signed in
      let resumeIdx = 0;
      let resumeSec = 0;
      try {
        const res = await fetch(`/api/audio/progress?audiobookId=${book.id}`);
        if (res.ok) {
          const { progress } = await res.json();
          if (progress?.chapter_id && book.chapters?.length) {
            const foundIdx = book.chapters.findIndex((c) => c.id === progress.chapter_id);
            if (foundIdx >= 0) {
              resumeIdx = foundIdx;
              resumeSec = progress.position_seconds || 0;
              setActiveChapterIndex(foundIdx);
              setCurrentTime(resumeSec);
            }
          }
        }
      } catch {
        // Ignore for guests
      }

      if (autoPlay) {
        await loadAndPlayChapter(book, resumeIdx, true, resumeSec);
      }
    },
    [activeBook?.id, activeChapterIndex, isPlaying, loadAndPlayChapter]
  );

  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current || !activeBook) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      syncProgress(audioRef.current.currentTime);
      return;
    }
    if (!audioRef.current.src || audioRef.current.src === window.location.href) {
      await loadAndPlayChapter(activeBook, activeChapterIndex, true, currentTime);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        await loadAndPlayChapter(activeBook, activeChapterIndex, true, currentTime);
      }
    }
  }, [activeBook, activeChapterIndex, currentTime, isPlaying, loadAndPlayChapter, syncProgress]);

  const selectChapter = useCallback(
    async (index) => {
      if (!activeBook) return;
      setActiveChapterIndex(index);
      setCurrentTime(0);
      setDuration(0);
      await loadAndPlayChapter(activeBook, index, true, 0);
    },
    [activeBook, loadAndPlayChapter]
  );

  const skipBy = useCallback((deltaSeconds) => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration || duration || 0;
    const next = Math.max(0, Math.min(dur || Infinity, audioRef.current.currentTime + deltaSeconds));
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  }, [duration]);

  const seekToRatio = useCallback(
    (ratio) => {
      if (!audioRef.current || !duration) return;
      let target = Math.max(0, Math.min(1, ratio)) * duration;

      // REQ-13: Free/Guest tier allows rewind, but caps forward seeking to +15s
      if (!tierCapabilities.allowFullSeeking && target > audioRef.current.currentTime + 15) {
        target = Math.min(duration, audioRef.current.currentTime + 15);
        setStreamError({
          type: "UPGRADE_REQUIRED",
          requiredTier: "plus",
          message: "Free tier limits forward seeking to +15s. Upgrade to Plus for unrestricted scrubbing.",
        });
      }

      audioRef.current.currentTime = target;
      setCurrentTime(target);
    },
    [duration, tierCapabilities.allowFullSeeking]
  );

  const cycleSpeed = useCallback(() => {
    const speeds = ["1.0x", "1.25x", "1.5x", "2.0x"];
    const maxAllowed = tierCapabilities.maxSpeed || 1.0;
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    const nextNumeric = parseFloat(nextSpeed);

    if (nextNumeric > maxAllowed) {
      setPlaybackSpeed("1.0x");
      if (audioRef.current) audioRef.current.playbackRate = 1.0;
      setStreamError({
        type: "UPGRADE_REQUIRED",
        requiredTier: nextNumeric > 1.5 ? "premium" : "plus",
        message: `Speed ${nextSpeed} requires ${nextNumeric > 1.5 ? "PREMIUM" : "PLUS"}. Free tier is capped at 1.0x.`,
      });
      return;
    }

    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextNumeric;
    }
  }, [playbackSpeed, tierCapabilities.maxSpeed]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const next = !isMuted;
    audioRef.current.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const setSleepTimer = useCallback((mode) => {
    if (!mode || mode === "off") {
      setSleepMode(null);
      setSleepSecondsLeft(0);
      return;
    }
    if (mode === "end_of_chapter") {
      setSleepMode("end_of_chapter");
      setSleepSecondsLeft(0);
      return;
    }
    const mins = Number(mode);
    if (mins > 0) {
      setSleepMode("countdown");
      setSleepSecondsLeft(mins * 60);
    }
  }, []);

  // Cache authorized chapter in IndexedDB for offline playback (REQ-30)
  const downloadChapterOffline = useCallback(async (book, chapter) => {
    if (!book || !chapter) return { ok: false };
    try {
      const already = await isChapterCachedOffline(chapter.id);
      if (already) return { ok: true, cached: true };

      const res = await fetch("/api/audio/stream-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStreamError({
          type: data.error || "GENERIC_ERROR",
          message: data.message || "Sign in to download chapters.",
          requiredTier: data.requiredTier,
        });
        return { ok: false };
      }

      const plan = data.tierCapabilities?.plan || "guest";
      if (plan === "guest" || plan === "free") {
        setStreamError({
          type: "UPGRADE_REQUIRED",
          requiredTier: "plus",
          message: "Offline caching requires Plus (1 chapter) or Premium (unlimited).",
        });
        return { ok: false };
      }
      if (plan === "plus") {
        const count = await getOfflineCachedCount();
        if (count >= 1) {
          setStreamError({
            type: "UPGRADE_REQUIRED",
            requiredTier: "premium",
            message: "Plus allows 1 offline chapter at a time. Upgrade to Premium for unlimited offline chapters.",
          });
          return { ok: false };
        }
      }

      const audioRes = await fetch(data.streamUrl);
      const blob = await audioRes.blob();
      await saveChapterOffline({
        chapterId: chapter.id,
        audiobookId: book.id,
        title: chapter.title,
        blob,
      });
      return { ok: true, cached: true };
    } catch {
      return { ok: false };
    }
  }, []);

  // Sleep Timer 1-second tick
  useEffect(() => {
    if (sleepMode !== "countdown" || !isPlaying) return;
    const id = setInterval(() => {
      setSleepSecondsLeft((prev) => {
        if (prev <= 1) {
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          setSleepMode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [sleepMode, isPlaying]);

  return (
    <AudioContext.Provider
      value={{
        activeBook,
        activeChapterIndex,
        currentChapter,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        playbackSpeed,
        isMuted,
        streamError,
        setStreamError,
        tierCapabilities,
        sleepMode,
        sleepSecondsLeft,
        selectBook,
        togglePlayPause,
        selectChapter,
        skipBy,
        seekToRatio,
        cycleSpeed,
        toggleMute,
        setSleepTimer,
        downloadChapterOffline,
      }}
    >
      {/* Persistent Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          const t = audioRef.current.currentTime;
          setCurrentTime(t);
          const now = Date.now();
          if (now - lastProgressSyncRef.current > 10000) {
            lastProgressSyncRef.current = now;
            syncProgress(t);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          syncProgress(duration || currentTime, true);
          if (sleepMode === "end_of_chapter") {
            setSleepMode(null);
            return;
          }
          if (activeBook && activeChapterIndex < chapters.length - 1) {
            selectChapter(activeChapterIndex + 1);
          }
        }}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
