/**
 * ==============================================================================
 * GolpoBook — Content Catalog Ingestion & Embedding Pipeline
 * File: scripts/seed-catalog.js
 * Purpose: Idempotent ingestion of authors, audiobooks, chapters, and RAG embeddings
 * Usage:
 *   node scripts/seed-catalog.js
 *   node scripts/seed-catalog.js --generate-embeddings
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Environment Variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (!process.env[match[1]]) {
        process.env[match[1]] = val.trim();
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ FATAL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const shouldGenerateEmbeddings = process.argv.includes('--generate-embeddings');

/**
 * Generate 768-dimensional vector embedding via Google Gemini API
 */
async function generateEmbedding(text, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-2',
      content: {
        parts: [{ text }],
      },
      outputDimensionality: 768,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (HTTP ${response.status}): ${errorText}`);
  }

  const result = await response.json();
  if (!result.embedding || !result.embedding.values) {
    throw new Error('Gemini API did not return embedding values');
  }

  return result.embedding.values;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSeed() {
  console.log('\n================================================================');
  console.log('📚 GOLPOBOOK CATALOG INGESTION & SEED ENGINE (PHASE 3C)');
  console.log('================================================================');

  // Load Seed Catalog JSON
  const catalogPath = path.resolve(process.cwd(), 'src/data/seed-catalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.error(`\n❌ Catalog file not found at: ${catalogPath}\n`);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`Loaded ${catalog.length} verified public-domain audiobooks from seed-catalog.json.`);

  // 1. Fetch Categories for UUID resolution
  console.log('\nFetching category taxonomy from Supabase...');
  const { data: categories, error: catErr } = await supabase.from('categories').select('id, slug, name');
  if (catErr) {
    console.error('❌ Failed to fetch categories:', catErr.message);
    process.exit(1);
  }

  const categoryMap = new Map();
  categories.forEach((cat) => categoryMap.set(cat.slug, cat.id));
  console.log(`Found ${categories.length} categories active in database.`);

  let authorsCount = 0;
  let booksCount = 0;
  let chaptersCount = 0;
  let embeddingsCount = 0;

  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    console.log(`\n[${i + 1}/${catalog.length}] Ingesting: "${item.title}" (${item.slug})`);

    // A. Upsert Author
    const authorPayload = {
      name: item.author.name,
      slug: item.author.slug,
      bio: item.author.bio,
      born_year: item.author.born_year,
      died_year: item.author.died_year,
      era: item.author.era,
    };

    const { data: authorData, error: authorErr } = await supabase
      .from('authors')
      .upsert(authorPayload, { onConflict: 'slug' })
      .select('id')
      .single();

    if (authorErr) {
      console.error(`❌ Failed to upsert author "${item.author.name}":`, authorErr.message);
      continue;
    }
    const authorId = authorData.id;
    authorsCount++;

    // B. Resolve Category
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      console.error(`❌ Category slug "${item.categorySlug}" not found in database! Skipping book.`);
      continue;
    }

    // C. Upsert Audiobook
    const audiobookPayload = {
      title: item.title,
      title_bengali: item.title_bengali || null,
      slug: item.slug,
      author_id: authorId,
      category_id: categoryId,
      narrator_name: item.narrator_name,
      description: item.description,
      short_description: item.short_description,
      cover_image_url: item.cover_image_url || null,
      language: item.language,
      tier_requirement: item.tier_requirement,
      is_featured: item.is_featured,
      is_published: item.is_published,
      total_duration_seconds: item.total_duration_seconds,
      rating_average: item.rating_average,
      ratings_count: item.ratings_count,
      publication_year: item.publication_year,
      tags: item.tags || [],
    };

    const { data: bookData, error: bookErr } = await supabase
      .from('audiobooks')
      .upsert(audiobookPayload, { onConflict: 'slug' })
      .select('id')
      .single();

    if (bookErr) {
      console.error(`❌ Failed to upsert audiobook "${item.title}":`, bookErr.message);
      continue;
    }
    const audiobookId = bookData.id;
    booksCount++;
    console.log(`   ✓ Audiobook metadata saved (ID: ${audiobookId})`);

    // D. Upsert Chapters
    if (item.chapters && item.chapters.length > 0) {
      for (const ch of item.chapters) {
        const chapterPayload = {
          audiobook_id: audiobookId,
          chapter_number: ch.chapter_number,
          title: ch.title,
          audio_storage_path: ch.audio_storage_path || null,
          duration_seconds: ch.duration_seconds || 0,
          is_preview: ch.is_preview || false,
        };

        const { error: chErr } = await supabase
          .from('chapters')
          .upsert(chapterPayload, { onConflict: 'audiobook_id,chapter_number' });

        if (chErr) {
          console.error(`   ⚠️ Failed to upsert chapter ${ch.chapter_number}:`, chErr.message);
        } else {
          chaptersCount++;
        }
      }
      console.log(`   ✓ Ingested ${item.chapters.length} chapters`);
    } else {
      console.log(`   ℹ️ Metadata-only mode: No chapters for this book yet.`);
    }

    // E. Generate Vector Embeddings (if requested & API key present)
    if (shouldGenerateEmbeddings) {
      if (!geminiApiKey) {
        console.log(`   ⚠️ GEMINI_API_KEY missing in .env.local. Skipping vector embedding.`);
      } else {
        try {
          const docText = item.semanticDocument || `${item.title}. ${item.description}`;
          const contentHash = crypto.createHash('sha256').update(docText).digest('hex');

          // Check if existing non-stale embedding with matching hash exists
          const { data: existingEmb } = await supabase
            .from('audiobook_embeddings')
            .select('content_hash, is_stale')
            .eq('audiobook_id', audiobookId)
            .single();

          if (existingEmb && existingEmb.content_hash === contentHash && !existingEmb.is_stale) {
            console.log(`   ✓ Vector embedding up-to-date (cached, hash matches).`);
            embeddingsCount++;
          } else {
            process.stdout.write(`   ⏳ Generating 768-dim embedding via gemini-embedding-2... `);
            const vector = await generateEmbedding(docText, geminiApiKey);

            const embeddingPayload = {
              audiobook_id: audiobookId,
              embedding: vector,
              embedding_model: 'models/gemini-embedding-2',
              dimensions: 768,
              content_hash: contentHash,
              is_stale: false,
            };

            const { error: embErr } = await supabase
              .from('audiobook_embeddings')
              .upsert(embeddingPayload, { onConflict: 'audiobook_id' });

            if (embErr) {
              console.error(`\n   ❌ Failed to store embedding:`, embErr.message);
            } else {
              console.log(`Done!`);
              embeddingsCount++;
            }

            // Safe rate limiting delay (1.5s) to stay within Google AI Studio quotas
            await sleep(1500);
          }
        } catch (embedError) {
          console.error(`\n   ❌ Error generating embedding:`, embedError.message);
        }
      }
    }
  }

  console.log('\n================================================================');
  console.log('🎉 INGESTION PIPELINE COMPLETE');
  console.log('================================================================');
  console.log(`• Authors Ingested:    ${authorsCount}`);
  console.log(`• Audiobooks Ingested: ${booksCount}`);
  console.log(`• Chapters Ingested:   ${chaptersCount}`);
  console.log(`• Embeddings Stored:   ${embeddingsCount}`);

  if (!shouldGenerateEmbeddings) {
    console.log('\n💡 Note: Embeddings were omitted. Run with `--generate-embeddings` to compute vectors.');
  }

  console.log('================================================================\n');
}

runSeed().catch((err) => {
  console.error('\n❌ Fatal script error:', err);
  process.exit(1);
});
