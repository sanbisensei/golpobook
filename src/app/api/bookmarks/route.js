import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/bookmarks?audiobookId=...
 * Checks if an audiobook is bookmarked, or lists all bookmarked IDs for the user.
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
      return NextResponse.json({ bookmarked: false, bookmarkIds: [] });
    }

    if (audiobookId) {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("audiobook_id", audiobookId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ bookmarked: false, notice: error.message });
      }
      return NextResponse.json({ bookmarked: Boolean(data) });
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .select("audiobook_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ bookmarkIds: [], notice: error.message });
    }
    return NextResponse.json({
      bookmarkIds: (data || []).map((r) => r.audiobook_id),
    });
  } catch (err) {
    console.error("GET /api/bookmarks error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

/**
 * POST /api/bookmarks
 * Toggles bookmark status for an audiobook.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { audiobookId } = body;

    if (!audiobookId) {
      return NextResponse.json({ error: "audiobookId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "Sign in to save audiobooks to your shelf." },
        { status: 401 }
      );
    }

    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("audiobook_id", audiobookId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("id", existing.id);
      return NextResponse.json({ bookmarked: false });
    }

    const { error: insertErr } = await supabase.from("bookmarks").insert({
      user_id: user.id,
      audiobook_id: audiobookId,
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ bookmarked: true });
  } catch (err) {
    console.error("POST /api/bookmarks error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
