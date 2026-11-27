import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/audio/progress?audiobookId=...
 * Returns saved playback position for the authenticated user.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const audiobookId = searchParams.get("audiobookId");
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ progress: null });
    }

    if (audiobookId) {
      const { data, error } = await supabase
        .from("listening_history")
        .select("audiobook_id, chapter_id, position_seconds, completed, last_played_at")
        .eq("user_id", user.id)
        .eq("audiobook_id", audiobookId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ progress: null, notice: error.message });
      }
      return NextResponse.json({ progress: data });
    }

    const { data, error } = await supabase
      .from("listening_history")
      .select("audiobook_id, chapter_id, position_seconds, completed, last_played_at")
      .eq("user_id", user.id)
      .order("last_played_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ history: [], notice: error.message });
    }
    return NextResponse.json({ history: data || [] });
  } catch (err) {
    console.error("GET /api/audio/progress error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

/**
 * POST /api/audio/progress
 * Upserts current playback position for an audiobook.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { audiobookId, chapterId, positionSeconds = 0, completed = false } = body;

    if (!audiobookId) {
      return NextResponse.json({ error: "audiobookId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ saved: false, reason: "UNAUTHENTICATED" }, { status: 401 });
    }

    const safePos = Math.max(0, Math.floor(Number(positionSeconds) || 0));

    const { error } = await supabase.from("listening_history").upsert(
      {
        user_id: user.id,
        audiobook_id: audiobookId,
        chapter_id: chapterId || null,
        position_seconds: safePos,
        completed: Boolean(completed),
        last_played_at: new Date().toISOString(),
      },
      { onConflict: "user_id,audiobook_id" }
    );

    if (error) {
      return NextResponse.json({ saved: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true, positionSeconds: safePos });
  } catch (err) {
    console.error("POST /api/audio/progress error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
