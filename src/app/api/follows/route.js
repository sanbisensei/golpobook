import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get("authorId");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !authorId) return NextResponse.json({ following: false });

  const { data } = await supabase
    .from("user_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("author_id", authorId)
    .maybeSingle();

  return NextResponse.json({ following: Boolean(data) });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { authorId } = body;
  if (!authorId) return NextResponse.json({ error: "authorId required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "AUTH_REQUIRED", message: "Sign in to follow authors." }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("user_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("author_id", authorId)
    .maybeSingle();

  if (existing) {
    await supabase.from("user_follows").delete().eq("id", existing.id);
    return NextResponse.json({ following: false });
  }

  const { error } = await supabase.from("user_follows").insert({ user_id: user.id, author_id: authorId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ following: true });
}
