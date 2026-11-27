import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const audiobookId = searchParams.get("audiobookId");
  if (!audiobookId) return NextResponse.json({ reviews: [] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, user_id")
    .eq("audiobook_id", audiobookId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ reviews: [], notice: error.message });
  return NextResponse.json({ reviews: data || [] });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { audiobookId, rating, comment = "" } = body;

    if (!audiobookId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "audiobookId and rating (1-5) required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "AUTH_REQUIRED", message: "Sign in to post a review." }, { status: 401 });
    }

    const { error } = await supabase.from("reviews").upsert(
      {
        user_id: user.id,
        audiobook_id: audiobookId,
        rating: Number(rating),
        comment: String(comment).trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,audiobook_id" }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/reviews error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
