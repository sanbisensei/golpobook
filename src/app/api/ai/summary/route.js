import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/ai/summary (REQ-26)
 * Generates a concise 3-sentence grounded summary of an audiobook using Gemini 3.5 Flash Lite.
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
        { error: "AUTH_REQUIRED", message: "Sign in to generate AI summaries." },
        { status: 401 }
      );
    }

    // Check monthly AI summary quota (Free: 0, Plus: 5/mo, Premium: 30/mo)
    const { data: quotaResult } = await supabase.rpc("check_and_consume_ai_quota", {
      p_feature: "ai_summary_monthly",
    });

    if (quotaResult && !quotaResult.allowed) {
      return NextResponse.json(
        {
          error: "UPGRADE_REQUIRED",
          message: "AI Book Summaries require Plus (5/mo) or Premium (30/mo).",
          quotaInfo: quotaResult,
        },
        { status: 403 }
      );
    }

    const { data: book } = await supabase
      .from("audiobooks")
      .select("title, title_bengali, description, short_description, author:authors(name)")
      .eq("id", audiobookId)
      .eq("is_published", true)
      .single();

    if (!book) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ summary: book.short_description || book.description });
    }

    const prompt = `Summarize this audiobook in exactly 3 crisp, engaging sentences without spoilers.
Title: ${book.title} (${book.title_bengali || ""})
Author: ${book.author?.name || ""}
Synopsis: ${book.description || book.short_description}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return NextResponse.json({ summary: text, quotaInfo: quotaResult });
    }

    return NextResponse.json({ summary: book.short_description || book.description });
  } catch (err) {
    console.error("POST /api/ai/summary error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
