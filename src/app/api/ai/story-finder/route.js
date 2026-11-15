import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapAudiobookRecord } from "@/lib/audiobook-utils";

/**
 * ==============================================================================
 * GolpoBook — AI Story Finder RAG API Route Handler
 * Endpoint: POST /api/ai/story-finder
 * Pipeline:
 *   1. Quota Check via atomic check_and_consume_ai_quota() RPC
 *   2. Query Normalizer (Banglish -> Normalized Bilingual Keywords via Gemini 2.5 Flash)
 *   3. Dense Vector Embedding (768 MRL via gemini-embedding-2)
 *   4. Vector Similarity Search via hardened match_audiobooks() RPC
 *   5. Grounded Recommendation Synthesis via Gemini 2.5 Flash
 * ==============================================================================
 */

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { query, language = null } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "INVALID_QUERY", message: "Please provide a search prompt." },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    const supabase = await createClient();
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // 1. Quota Check for Authenticated Users (Optional for guests)
    let quotaInfo = { allowed: true };
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: quotaResult } = await supabase.rpc("check_and_consume_ai_quota", {
        p_feature: "story_finder_daily",
      });
      if (quotaResult) {
        quotaInfo = quotaResult;
        if (!quotaResult.allowed) {
          return NextResponse.json(
            {
              error: "QUOTA_EXCEEDED",
              message: "Daily AI Story Finder limit reached for your plan. Please upgrade for more searches.",
              quotaInfo,
            },
            { status: 429 }
          );
        }
      }
    }

    // 2. Check if Gemini API Key is configured
    if (!geminiApiKey) {
      // Fallback Mode: Heuristic Keyword Search if API key is not yet set in .env.local
      console.warn("Notice: GEMINI_API_KEY is not configured in .env.local. Running keyword fallback.");
      
      const searchTerms = trimmedQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      
      let queryBuilder = supabase
        .from("audiobooks")
        .select(`
          id,
          title,
          title_bengali,
          slug,
          narrator_name,
          description,
          short_description,
          cover_image_url,
          language,
          tier_requirement,
          is_featured,
          is_published,
          total_duration_seconds,
          rating_average,
          ratings_count,
          publication_year,
          tags,
          author:authors (name, slug),
          category:categories (name, slug),
          chapters (id, chapter_number, title, duration_seconds, is_preview)
        `)
        .eq("is_published", true)
        .limit(5);

      if (searchTerms.length > 0) {
        const ilikeQuery = searchTerms.map((t) => `title.ilike.%${t}%,description.ilike.%${t}%`).join(",");
        queryBuilder = queryBuilder.or(ilikeQuery);
      }

      const { data: fallbackBooks } = await queryBuilder;
      const books = (fallbackBooks || []).map(mapAudiobookRecord);

      return NextResponse.json({
        query: trimmedQuery,
        normalizedQuery: trimmedQuery,
        aiMessage: `(API Key Notice: Add GEMINI_API_KEY to .env.local to unlock full semantic RAG). Showing ${books.length} matching audiobooks for: "${trimmedQuery}".`,
        books,
        isSemanticSearch: false,
        quotaInfo,
      });
    }

    // --------------------------------------------------------------------------
    // STAGE 1: Query Normalization via Gemini 2.5 Flash
    // --------------------------------------------------------------------------
    let normalizedKeywords = trimmedQuery;
    try {
      const normalizerUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const normalizerRes = await fetch(normalizerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a search query normalizer for GolpoBook, a Bengali & English audiobook platform.
The user submitted this search query in English, Bengali, or phonetic Banglish: "${trimmedQuery}".
Analyze the mood, feeling, themes, and literary genres implied by this query.
Output ONLY a concise, space-separated string of search keywords in both Bengali script and English.
Do NOT include explanations or punctuation.
Example:
Input: "amar voyer golpo shunte mon chacche"
Output: ভৌতিক রহস্য গা ছমছমে horror supernatural thriller ghost mystery suspense`,
                },
              ],
            },
          ],
        }),
      });

      if (normalizerRes.ok) {
        const normalizerData = await normalizerRes.json();
        const extractedText = normalizerData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (extractedText && extractedText.trim()) {
          normalizedKeywords = extractedText.trim();
        }
      }
    } catch (normErr) {
      console.warn("Query normalizer notice:", normErr.message);
    }

    // --------------------------------------------------------------------------
    // STAGE 2: Dense Vector Embedding via gemini-embedding-2 (768 MRL)
    // --------------------------------------------------------------------------
    let queryVector = null;
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiApiKey}`;
    const embedRes = await fetch(embedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: {
          parts: [{ text: normalizedKeywords }],
        },
        outputDimensionality: 768,
      }),
    });

    if (embedRes.ok) {
      const embedData = await embedRes.json();
      queryVector = embedData.embedding?.values || null;
    } else {
      const errText = await embedRes.text();
      console.error("Embedding API error:", errText);
    }

    // If embedding generation failed, return fallback
    if (!queryVector || queryVector.length !== 768) {
      return NextResponse.json(
        {
          error: "EMBEDDING_FAILED",
          message: "Could not generate vector embedding for the query.",
        },
        { status: 502 }
      );
    }

    // --------------------------------------------------------------------------
    // STAGE 3: Hardened Supabase Vector Similarity Search via match_audiobooks()
    // --------------------------------------------------------------------------
    const { data: matchedRows, error: rpcErr } = await supabase.rpc("match_audiobooks", {
      query_embedding: queryVector,
      match_threshold: 0.15,
      match_count: 4,
      p_language: language,
    });

    if (rpcErr) {
      console.error("match_audiobooks RPC error:", rpcErr);
      return NextResponse.json(
        { error: "SEARCH_FAILED", message: "Database vector search failed." },
        { status: 500 }
      );
    }

    const matchedBooks = matchedRows || [];

    // If no direct vector matches met threshold, get top 3 popular published books as fallback
    let booksToDisplay = matchedBooks;
    if (booksToDisplay.length === 0) {
      const { data: popularFallback } = await supabase
        .from("audiobooks")
        .select(`
          id,
          title,
          title_bengali,
          slug,
          narrator_name,
          short_description,
          cover_image_url,
          tier_requirement,
          total_duration_seconds,
          author:authors (name),
          category:categories (name)
        `)
        .eq("is_published", true)
        .order("ratings_count", { ascending: false })
        .limit(3);

      booksToDisplay = (popularFallback || []).map((b) => ({
        id: b.id,
        title: b.title,
        title_bengali: b.title_bengali,
        slug: b.slug,
        author_name: b.author?.name || "Unknown Author",
        narrator_name: b.narrator_name,
        category_name: b.category?.name || "Literature",
        short_description: b.short_description,
        cover_image_url: b.cover_image_url,
        tier_requirement: b.tier_requirement,
        total_duration_seconds: b.total_duration_seconds,
        similarity: 0.0,
      }));
    }

    // --------------------------------------------------------------------------
    // STAGE 4: Grounded Zero-Hallucination Recommendation Generation
    // --------------------------------------------------------------------------
    let aiMessage = "আপনার পছন্দের সাথে মিল রেখে নিচের অডিওবুকগুলো খুঁজে পাওয়া গেছে:";

    try {
      const bookContext = booksToDisplay
        .map((b, idx) => `${idx + 1}. "${b.title}" (${b.title_bengali || ""}) by ${b.author_name} - ${b.short_description}`)
        .join("\n");

      const synthesisUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const synthesisRes = await fetch(synthesisUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are the friendly AI Story Finder for GolpoBook, speaking to a listener in warm, polite Bengali (বাংলা).
The user asked: "${trimmedQuery}".
We searched our database and retrieved these EXACT matching audiobooks from our catalog:
${bookContext}

Write a short, engaging 2-to-3 sentence recommendation in Bengali explaining why these specific books are great picks for the listener's mood.
CRITICAL RULES:
1. Mention ONLY the books listed above.
2. DO NOT invent or recommend any titles outside this list.
3. Be conversational, inspiring, and concise.`,
                },
              ],
            },
          ],
        }),
      });

      if (synthesisRes.ok) {
        const synthData = await synthesisRes.json();
        const synthText = synthData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (synthText && synthText.trim()) {
          aiMessage = synthText.trim();
        }
      }
    } catch (synthErr) {
      console.warn("Recommendation synthesis notice:", synthErr.message);
    }

    return NextResponse.json({
      query: trimmedQuery,
      normalizedQuery: normalizedKeywords,
      aiMessage,
      books: booksToDisplay,
      isSemanticSearch: true,
      quotaInfo,
    });
  } catch (error) {
    console.error("Fatal error in /api/ai/story-finder:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to process AI Story Finder request." },
      { status: 500 }
    );
  }
}
