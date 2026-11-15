"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Compass,
  BookOpen,
  Search,
  Ghost,
  Cpu,
  Radio,
  GraduationCap,
  Flag,
  Heart,
  Sun,
  Sunset,
  Moon,
  Clock,
  Sliders,
  Languages,
  Flame,
  Music,
  Headphones,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Dynamic icon mapper for Supabase categories (extensible for future genres)
const CATEGORY_ICONS = {
  Compass,
  BookOpen,
  Search,
  Ghost,
  Sparkles,
  Cpu,
  Radio,
  GraduationCap,
  Flag,
  Heart,
  Music,
  Headphones,
};

// Fallback categories guarantee that all 10 seeded categories are always rendered
export const FALLBACK_CATEGORIES = [
  {
    id: "e23b622a-45d1-46e0-ae06-c5b10c255b9f",
    name: "Adventure & Thriller",
    slug: "adventure-thriller",
    icon_name: "Compass",
    description: "High-stakes expeditions, survival journeys, and adrenaline chases.",
    display_order: 1,
  },
  {
    id: "f34c733b-56e2-57f1-bf17-d6c21d366caf",
    name: "Classic Literature",
    slug: "classic-literature",
    icon_name: "BookOpen",
    description: "Timeless Bengali and international literary masterpieces.",
    display_order: 2,
  },
  {
    id: "a45d844c-67f3-68a2-c028-e7d32e477db0",
    name: "Mystery & Detective",
    slug: "mystery-detective",
    icon_name: "Search",
    description: "Intellectual whodunits, sleuth adventures, and forensic mysteries.",
    display_order: 3,
  },
  {
    id: "b56e955d-78a4-79b3-d139-f8e43f588ec1",
    name: "Supernatural & Horror",
    slug: "supernatural-horror",
    icon_name: "Ghost",
    description: "Spine-chilling ghost stories and psychological folklore.",
    display_order: 4,
  },
  {
    id: "c67fa66e-89b5-8ac4-e24a-a9f54a699fd2",
    name: "Magical Realism",
    slug: "magical-realism",
    icon_name: "Sparkles",
    description: "Surreal worlds blending mythical fantasy with everyday realism.",
    display_order: 5,
  },
  {
    id: "d780b77f-90c6-9bd5-f35b-b0a65b7aa0e3",
    name: "Dystopian Sci-Fi",
    slug: "dystopian-sci-fi",
    icon_name: "Cpu",
    description: "Futuristic sagas, dystopias, and space exploration.",
    display_order: 6,
  },
  {
    id: "e891c880-01d7-0ce6-046c-c1b76c8bb1f4",
    name: "Podcasts",
    slug: "podcasts",
    icon_name: "Radio",
    description: "Conversational shows, investigative journalism, and weekly talks.",
    display_order: 7,
  },
  {
    id: "f902d991-12e8-1df7-157d-d2c87d9cc205",
    name: "E-Learning",
    slug: "e-learning",
    icon_name: "GraduationCap",
    description: "Self-improvement, history, and educational lectures.",
    display_order: 8,
  },
  {
    id: "0a13ea02-23f9-2e08-268e-e3d98ea0d316",
    name: "Historical & Liberation War",
    slug: "historical-liberation-war",
    icon_name: "Flag",
    description: "Accounts of 1971 Bangladesh Liberation War and chronicles.",
    display_order: 9,
  },
  {
    id: "1b24fb13-340a-3f19-379f-f4ea9fb1e427",
    name: "Romance & Drama",
    slug: "romance-drama",
    icon_name: "Heart",
    description: "Emotional literary dramas, romantic tragedies, and sagas.",
    display_order: 10,
  },
];

// Available languages (Step 2)
const LANGUAGES = [
  {
    id: "bangla",
    label: "বাংলা (Bangla)",
    nativeLabel: "বাংলা অডিওবুক ও সাহিত্য",
    description: "Classic Bengali literature, original Natok audio, and native podcasts.",
    badge: "PRIMARY",
  },
  {
    id: "english",
    label: "English",
    nativeLabel: "Global Audiobooks & Non-Fiction",
    description: "International bestsellers, productivity guides, and world narratives.",
    badge: "GLOBAL",
  },
];

// Curated thematic interests (Step 4)
const LISTENING_INTERESTS = [
  { id: "fiction", label: "Fiction & Novels" },
  { id: "horror", label: "Horror (ভূতের গল্প)" },
  { id: "thriller", label: "Thriller (রোমাঞ্চ)" },
  { id: "non-fiction", label: "Non-Fiction" },
  { id: "self-development", label: "Self-Development" },
  { id: "history", label: "History (ইতিহাস)" },
  { id: "mystery", label: "Detective (গোয়েন্দা)" },
  { id: "romance", label: "Romance" },
  { id: "fantasy", label: "Fantasy (রূপকথা)" },
  { id: "science", label: "Science & Tech" },
  { id: "religion-spirituality", label: "Philosophy & Spirituality" },
  { id: "business", label: "Business" },
  { id: "education", label: "Education" },
];

// Listening time slots (Step 5)
const LISTENING_TIMES = [
  { id: "morning", label: "Morning", sub: "06:00 – 11:00", icon: Sun },
  { id: "afternoon", label: "Afternoon", sub: "11:00 – 17:00", icon: Sunset },
  { id: "evening", label: "Evening", sub: "17:00 – 21:00", icon: Clock },
  { id: "night", label: "Night", sub: "21:00 – Late", icon: Moon },
  { id: "flexible", label: "Anytime", sub: "Flexible", icon: Sliders },
];

// Content format choices (Step 5)
const CONTENT_PREFERENCES = [
  { id: "both", label: "Audiobooks & Podcasts", desc: "Full catalog access across stories and episodes." },
  { id: "audiobooks", label: "Audiobooks Primarily", desc: "Long-form chapter-by-chapter book streaming." },
  { id: "podcasts", label: "Podcasts Primarily", desc: "Episodic discussions, news & interviews." },
];

// Spring directional step transitions
const stepVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 340, damping: 28 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (dir) => ({
    x: dir > 0 ? -32 : 32,
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 340, damping: 28 },
      opacity: { duration: 0.15 },
    },
  }),
};

export function OnboardingWizard({ user, initialCategories = [], initialPreferences = null }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const totalSteps = 6;

  // Use live database categories if present, otherwise merge with canonical fallback categories
  const categories =
    initialCategories && initialCategories.length > 0
      ? initialCategories
      : FALLBACK_CATEGORIES;

  // Form State initialized from existing preferences if available
  const [languages, setLanguages] = useState(
    initialPreferences?.preferred_languages?.length
      ? initialPreferences.preferred_languages
      : ["bangla"]
  );

  const [selectedCategoryIds, setSelectedCategoryIds] = useState(
    initialPreferences?.preferred_category_ids?.length
      ? initialPreferences.preferred_category_ids
      : categories.length >= 2
      ? [categories[0].id, categories[1].id]
      : []
  );

  const [selectedInterests, setSelectedInterests] = useState(
    initialPreferences?.listening_interests?.length
      ? initialPreferences.listening_interests
      : []
  );

  const [listeningTime, setListeningTime] = useState(
    initialPreferences?.listening_time || "evening"
  );

  const [contentPreference, setContentPreference] = useState(
    initialPreferences?.content_preference || "both"
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Toggle Language
  const toggleLanguage = (langId) => {
    setLanguages((prev) => {
      if (prev.includes(langId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== langId);
      }
      return [...prev, langId];
    });
  };

  // Toggle Category
  const toggleCategory = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  // Toggle Thematic Interest
  const toggleInterest = (interestId) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  // Save Preferences and Complete Onboarding
  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          preferred_languages: languages,
          preferred_category_ids: selectedCategoryIds,
          listening_interests: selectedInterests,
          listening_time: listeningTime,
          content_preference: contentPreference,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }

      // Smooth transition to catalog
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 500);
    } catch (err) {
      setSaveError(err.message || "Failed to persist preferences. Please try again.");
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden select-none">
      {/* Main Canvas Area (Centered in the viewport, strictly scroll-less) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 w-full max-w-5xl mx-auto overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ============================================================ */}
          {/* STEP 1: BOLD, BIG, GRAND WELCOME (MINIMAL PUNCHY COPY)       */}
          {/* ============================================================ */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-3xl mx-auto text-center flex flex-col items-center space-y-6 sm:space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-canary text-ink border-[1.5px] border-ink shadow-hard-xs font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="size-4 text-terracotta" />
                <span>Audio First Platform</span>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-foreground leading-[0.94]">
                  Welcome to <span className="text-terracotta">GolpoBook</span>.
                </h1>

                <p className="font-heading text-xl sm:text-3xl md:text-4xl font-bold text-foreground/90 tracking-tight leading-snug">
                  Let’s start the audio listening journey.
                </p>

                <p className="font-mono text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  A personalized listening experience tuned to your languages, genres, and stories.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="xl"
                  onClick={handleNext}
                  className="gap-3 font-heading font-bold shadow-hard-sm hover:shadow-hard-md text-base sm:text-lg px-8 py-4 h-14"
                >
                  <span>Start Personalizing</span>
                  <ArrowRight className="size-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: PREFERRED LANGUAGES                                  */}
          {/* ============================================================ */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-2xl w-full mx-auto text-center flex flex-col items-center space-y-6"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted border-[1.5px] border-ink text-xs font-mono text-muted-foreground uppercase">
                  <Languages className="size-3.5 text-terracotta" />
                  <span>Language Preference</span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-4xl text-foreground tracking-tight">
                  Choose your listening languages.
                </h2>
                <p className="font-mono text-xs sm:text-sm text-muted-foreground">
                  Select one or both. You can always stream any title in the library.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left pt-1">
                {LANGUAGES.map((lang) => {
                  const isSelected = languages.includes(lang.id);
                  return (
                    <motion.div
                      key={lang.id}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleLanguage(lang.id)}
                      className={`p-5 sm:p-6 border-[1.5px] border-ink cursor-pointer select-none transition-all duration-150 relative ${
                        isSelected
                          ? "bg-canary/35 shadow-hard-md ring-2 ring-terracotta -translate-x-0.5 -translate-y-0.5"
                          : "bg-card shadow-hard-xs hover:bg-muted/40 hover:shadow-hard-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 bg-card border-[1.5px] border-ink font-mono text-[10px] font-bold uppercase">
                          {lang.badge}
                        </span>
                        <div
                          className={`size-7 border-[1.5px] border-ink flex items-center justify-center transition-colors ${
                            isSelected ? "bg-terracotta text-white" : "bg-card"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 450, damping: 20 }}
                            >
                              <Check className="size-4 stroke-[3]" />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                        {lang.label}
                      </h3>
                      <p className="font-mono text-xs text-terracotta font-semibold mt-0.5">
                        {lang.nativeLabel}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-2 leading-relaxed">
                        {lang.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: FAVORITE GENRES (LIVE DATABASE CATEGORIES)           */}
          {/* ============================================================ */}
          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-4xl w-full mx-auto text-center flex flex-col items-center space-y-4 sm:space-y-5"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-muted border-[1.5px] border-ink text-xs font-mono text-muted-foreground uppercase">
                  <Compass className="size-3.5 text-terracotta" />
                  <span>Catalog Taxonomy</span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-4xl text-foreground tracking-tight">
                  Pick your favorite genres.
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  Select at least one genre to calibrate your discovery feed.
                </p>
              </div>

              {/* Compact 5x2 grid: zero scroll, fits cleanly on screen */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 w-full text-left pt-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  const IconComponent = CATEGORY_ICONS[cat.icon_name] || BookOpen;

                  return (
                    <motion.div
                      key={cat.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 sm:p-3.5 border-[1.5px] border-ink cursor-pointer select-none transition-all duration-150 flex flex-col justify-between min-h-[85px] sm:min-h-[95px] ${
                        isSelected
                          ? "bg-terracotta text-white shadow-hard-xs -translate-x-0.5 -translate-y-0.5"
                          : "bg-card text-foreground shadow-hard-2xs hover:bg-muted hover:shadow-hard-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div
                          className={`size-7 border-[1.5px] border-ink flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-white text-terracotta" : "bg-muted text-foreground"
                          }`}
                        >
                          <IconComponent className="size-3.5" />
                        </div>

                        <div
                          className={`size-4 border-[1.5px] border-ink flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-white text-terracotta" : "bg-card"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 450, damping: 20 }}
                            >
                              <Check className="size-3 stroke-[3]" />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-heading text-xs sm:text-sm font-bold leading-tight line-clamp-1">
                          {cat.name}
                        </h4>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: LISTENING INTERESTS (THEMATIC CURIOSITY TAGS)        */}
          {/* ============================================================ */}
          {step === 4 && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-3xl w-full mx-auto text-center flex flex-col items-center space-y-5"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted border-[1.5px] border-ink text-xs font-mono text-muted-foreground uppercase">
                  <Sparkles className="size-3.5 text-terracotta" />
                  <span>Thematic Curiosity</span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-4xl text-foreground tracking-tight">
                  What themes spark your curiosity?
                </h2>
                <p className="font-mono text-xs sm:text-sm text-muted-foreground">
                  Pick any themes you love. Our engine will surface stories matching these vibes.
                </p>
              </div>

              {/* Centered pill tags */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl w-full pt-1">
                {LISTENING_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.id);

                  return (
                    <motion.button
                      key={interest.id}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleInterest(interest.id)}
                      className={`px-3.5 py-2 border-[1.5px] border-ink font-sans text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-canary text-ink shadow-hard-xs -translate-x-0.5 -translate-y-0.5 ring-2 ring-terracotta"
                          : "bg-card text-foreground hover:bg-muted shadow-hard-2xs"
                      }`}
                    >
                      <div
                        className={`size-3.5 border border-ink flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-terracotta text-white" : "bg-card"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                          >
                            <Check className="size-2.5 stroke-[3]" />
                          </motion.div>
                        )}
                      </div>
                      <span>{interest.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: LISTENING HABITS & SCHEDULE (OPTIONAL)               */}
          {/* ============================================================ */}
          {step === 5 && (
            <motion.div
              key="step-5"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-3xl w-full mx-auto text-center flex flex-col items-center space-y-5"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-muted border-[1.5px] border-ink text-xs font-mono text-muted-foreground uppercase">
                  <Clock className="size-3.5 text-terracotta" />
                  <span>Optional Routine</span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-4xl text-foreground tracking-tight">
                  When do you listen most?
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  Optional. Helps us recommend commute episodes or immersive bedtime chapters.
                </p>
              </div>

              {/* Part A: Time Slot (5 in 1 row on desktop) */}
              <div className="w-full space-y-2 text-left">
                <label className="block font-heading text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Preferred Time of Day:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full">
                  {LISTENING_TIMES.map((time) => {
                    const isSelected = listeningTime === time.id;
                    const Icon = time.icon;

                    return (
                      <motion.div
                        key={time.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setListeningTime(time.id)}
                        className={`p-2.5 border-[1.5px] border-ink cursor-pointer select-none transition-all duration-150 ${
                          isSelected
                            ? "bg-terracotta text-white shadow-hard-xs -translate-x-0.5 -translate-y-0.5"
                            : "bg-card text-foreground hover:bg-muted shadow-hard-2xs"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="size-3.5 shrink-0" />
                          <span className="font-heading text-xs font-bold leading-tight line-clamp-1">
                            {time.label}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-[10px] block ${
                            isSelected ? "text-white/80" : "text-muted-foreground"
                          }`}
                        >
                          {time.sub}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Part B: Format Preference (3 in 1 row) */}
              <div className="w-full space-y-2 text-left pt-1">
                <label className="block font-heading text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Preferred Audio Format:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                  {CONTENT_PREFERENCES.map((pref) => {
                    const isSelected = contentPreference === pref.id;

                    return (
                      <motion.div
                        key={pref.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setContentPreference(pref.id)}
                        className={`p-3 border-[1.5px] border-ink cursor-pointer select-none transition-all duration-150 ${
                          isSelected
                            ? "bg-canary text-ink shadow-hard-xs -translate-x-0.5 -translate-y-0.5 ring-2 ring-terracotta"
                            : "bg-card text-foreground hover:bg-muted shadow-hard-2xs"
                        }`}
                      >
                        <span className="font-heading text-xs font-bold block mb-0.5">
                          {pref.label}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground leading-tight block">
                          {pref.desc}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 6: COMPLETION & TASTE PROFILE SUMMARY                   */}
          {/* ============================================================ */}
          {step === 6 && (
            <motion.div
              key="step-6"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-md w-full mx-auto text-center flex flex-col items-center space-y-4 sm:space-y-5"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-canary text-ink border-[1.5px] border-ink shadow-hard-2xs font-mono text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="size-4 text-terracotta" />
                  <span>Taste Profile Calibrated</span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-4xl text-foreground tracking-tight">
                  You’re all set.
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  We’ve personalized your GolpoBook library with your custom preferences.
                </p>
              </div>

              {saveError && (
                <div className="p-3 bg-destructive/10 border-[1.5px] border-destructive text-destructive font-mono text-xs w-full">
                  {saveError}
                </div>
              )}

              {/* Minimal Editorial Taste Profile Summary */}
              <div className="border-[1.5px] border-ink bg-card p-4 sm:p-5 shadow-hard-sm space-y-3 w-full text-left">
                <div className="flex items-center justify-between border-b-[1.5px] border-ink/20 pb-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-terracotta">
                    TASTE PROFILE RECEIPT
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Free Explorer Tier
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div>
                    <span className="font-bold text-foreground block mb-1 text-[11px]">Languages:</span>
                    <div className="flex gap-1 flex-wrap">
                      {languages.map((l) => (
                        <span
                          key={l}
                          className="px-2 py-0.5 bg-muted border border-ink text-[10px] uppercase font-bold"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-foreground block mb-1 text-[11px]">Schedule:</span>
                    <span className="capitalize text-[11px]">{listeningTime} ({contentPreference})</span>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[11px] font-bold text-foreground block mb-1">
                    Favorite Genres ({selectedCategoryIds.length}):
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedCategoryIds.map((catId) => {
                      const cat = categories.find((c) => c.id === catId);
                      return (
                        <span
                          key={catId}
                          className="px-2 py-0.5 bg-canary/30 border border-ink text-[10px] font-bold"
                        >
                          {cat?.name || "Genre"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ============================================================ */}
      {/* BOTTOM STEP BAR & CONTROLS (PINS TO BOTTOM, SCROLL-LESS)     */}
      {/* ============================================================ */}
      <footer className="w-full border-t-[1.5px] border-ink bg-background/95 backdrop-blur-md px-6 sm:px-12 py-3.5 sm:py-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Back button or Brand Mark */}
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                <span>Back</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 select-none">
                <div className="size-7 bg-terracotta text-white flex items-center justify-center border-[1.5px] border-ink shadow-hard-2xs">
                  <Flame className="size-4 fill-white" />
                </div>
                <span className="font-heading text-sm font-bold uppercase tracking-tight hidden sm:inline">
                  Golpo<span className="text-terracotta">Book</span>
                </span>
              </div>
            )}
          </div>

          {/* Center: Tactile Step Progress Bar */}
          <div className="flex flex-col items-center gap-1.5 w-44 sm:w-64">
            <div className="flex items-center justify-between w-full font-mono text-[11px] font-bold">
              <span className="text-foreground uppercase tracking-wider">Step 0{step}</span>
              <span className="text-muted-foreground">/ 06</span>
            </div>
            <div className="w-full h-2 bg-muted border-[1.5px] border-ink overflow-hidden">
              <motion.div
                className="h-full bg-terracotta"
                initial={false}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          {/* Right: Continue / Skip Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {step === 5 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="font-mono text-xs"
              >
                Skip
              </Button>
            )}

            {step < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                size="default"
                onClick={handleNext}
                disabled={step === 3 && selectedCategoryIds.length === 0}
                className="gap-2 font-bold"
              >
                <span>Continue</span>
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="default"
                onClick={handleComplete}
                disabled={saving}
                className="gap-2 font-bold bg-terracotta text-white shadow-hard-sm"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Enter GolpoBook</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
