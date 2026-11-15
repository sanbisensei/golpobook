import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ==============================================================================
 * GolpoBook — Secure Audio Chapter Streaming API Handler
 * Endpoint: POST /api/audio/stream-url
 * Purpose: Authorizes playback and generates short-lived (15-min) signed URLs
 *          from private Supabase Storage bucket 'audio-vault'.
 * ==============================================================================
 */

// Fallback royalty-free demonstration audio (public domain archive) for testing before vault uploads
const FALLBACK_DEMO_AUDIO = "https://ia800207.us.archive.org/29/items/LibrivoxShortPoetryCollection001/trees_kilmer_klh_64kb.mp3";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { chapterId } = body;

    if (!chapterId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "chapterId is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Fetch chapter with joined parent audiobook metadata
    const { data: chapter, error: chapterErr } = await supabase
      .from("chapters")
      .select(`
        id,
        chapter_number,
        title,
        audio_storage_path,
        duration_seconds,
        is_preview,
        audiobook:audiobooks (
          id,
          title,
          slug,
          tier_requirement,
          is_published
        )
      `)
      .eq("id", chapterId)
      .single();

    if (chapterErr || !chapter || !chapter.audiobook) {
      return NextResponse.json(
        { error: "CHAPTER_NOT_FOUND", message: "Chapter not found." },
        { status: 404 }
      );
    }

    // 2. Mandatory Gate: Unpublished Content Protection
    // A preview chapter must NEVER bypass the publication check!
    if (!chapter.audiobook.is_published) {
      return NextResponse.json(
        { error: "AUDIOBOOK_NOT_FOUND", message: "Audiobook not found or unpublished." },
        { status: 404 }
      );
    }

    const isPreview = Boolean(chapter.is_preview);
    const bookTier = chapter.audiobook.tier_requirement || "free";

    // 3. 4-Tier Access Authorization Evaluation
    if (!isPreview) {
      // Full non-preview chapter: Requires authenticated session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          {
            error: "AUTH_REQUIRED",
            message: "Sign in to listen to full chapters.",
            chapterId,
            isPreview: false,
          },
          { status: 401 }
        );
      }

      // Query active subscription tier
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select("plan_id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      const userPlan = subscription?.plan_id || "free";

      let isAllowed = false;
      if (userPlan === "premium") {
        isAllowed = true;
      } else if (userPlan === "plus") {
        isAllowed = bookTier === "free" || bookTier === "plus";
      } else if (userPlan === "free") {
        isAllowed = bookTier === "free";
      }

      if (!isAllowed) {
        return NextResponse.json(
          {
            error: "UPGRADE_REQUIRED",
            message: `This chapter requires a GolpoBook ${bookTier.toUpperCase()} subscription.`,
            requiredTier: bookTier,
            currentPlan: userPlan,
            chapterId,
            isPreview: false,
          },
          { status: 403 }
        );
      }
    }

    // 4. Generate 15-minute Signed URL from Supabase Storage 'audio-vault'
    let streamUrl = null;
    let isVaultAudio = false;

    if (chapter.audio_storage_path) {
      try {
        const adminClient = createAdminClient();
        const { data: signedData, error: signedError } = await adminClient.storage
          .from("audio-vault")
          .createSignedUrl(chapter.audio_storage_path, 900); // 15-minute token TTL

        if (!signedError && signedData?.signedUrl) {
          streamUrl = signedData.signedUrl;
          isVaultAudio = true;
        }
      } catch (storageError) {
        console.warn("Storage signed URL generation notice:", storageError.message);
      }
    }

    // If file is not yet physically uploaded to Supabase Storage, provide fallback demo stream
    if (!streamUrl) {
      streamUrl = FALLBACK_DEMO_AUDIO;
      isVaultAudio = false;
    }

    return NextResponse.json({
      streamUrl,
      isVaultAudio,
      expiresIn: 900,
      chapter: {
        id: chapter.id,
        chapterNumber: chapter.chapter_number,
        title: chapter.title,
        durationSeconds: chapter.duration_seconds,
        isPreview,
      },
      audiobook: {
        id: chapter.audiobook.id,
        title: chapter.audiobook.title,
        slug: chapter.audiobook.slug,
        tierRequirement: bookTier,
      },
    });
  } catch (error) {
    console.error("Fatal error in /api/audio/stream-url:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to generate audio stream URL." },
      { status: 500 }
    );
  }
}
