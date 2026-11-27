import Link from "next/link";
import { LifeBuoy, Headphones, Sparkles, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { NavigationRail } from "@/components/layout/navigation-rail";
import { BottomNav } from "@/components/layout/bottom-nav";

export const metadata = {
  title: "Help & Support — GolpoBook",
  description: "FAQs, tier benefits, offline listening guide, and support for GolpoBook listeners.",
};

const FAQS = [
  {
    q: "How does the AI Story Finder work in Bangla and Banglish?",
    a: "Type how you feel in বাংলা, Banglish (e.g. 'amar voyer golpo shunte mon chacche'), or English. GolpoBook normalizes your mood and matches it against our 69-book catalog using 768-dimensional vector search — with zero made-up titles.",
  },
  {
    q: "What is included in Free, Plus, and Premium tiers?",
    a: "Free listeners can stream all Free-tier books and Chapter 1 previews of every book at 1.0x speed. Plus unlocks Plus-tier books, 1.5x speed, unrestricted scrubbing, Sleep Timer, and 1 offline chapter. Premium unlocks the entire catalog, 2.0x speed, and unlimited offline chapters.",
  },
  {
    q: "How does Offline listening work on the web?",
    a: "Plus and Premium listeners can click 'Offline' in the right-side player to cache authorized chapters securely in their browser's origin-private IndexedDB storage.",
  },
  {
    q: "Why did my audio stop or ask me to upgrade on Chapter 2?",
    a: "Chapter 1 of every audiobook is a free preview. Full chapters of Plus and Premium books require signing in with an active matching subscription.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <TopHeader />
      <NavigationRail />

      <div className="md:pl-20 min-h-screen pt-16 pb-20 md:pb-10 flex flex-col">
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8">
          <section className="border-[1.5px] border-ink bg-canary p-6 md:p-8 rounded-xl shadow-hard-md">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="size-9 bg-terracotta text-white flex items-center justify-center border-[1.5px] border-ink rounded-lg shadow-hard-2xs">
                <LifeBuoy className="size-5" />
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-ink tracking-tight">
                Help & Support
              </h1>
            </div>
            <p className="font-mono text-xs md:text-sm text-ink-muted max-w-2xl">
              Everything you need to know about streaming, AI Story Finder, offline caching, and GolpoBook subscriptions.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/story-finder"
              className="border-[1.5px] border-ink bg-card p-5 rounded-xl shadow-hard-xs hover:shadow-hard-sm hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="size-5 text-terracotta mb-2" />
              <h2 className="font-heading text-sm font-bold uppercase mb-1">AI Story Finder</h2>
              <p className="font-mono text-xs text-muted-foreground">
                Search by mood in Bangla, Banglish, or English.
              </p>
            </Link>

            <Link
              href="/audiobooks"
              className="border-[1.5px] border-ink bg-card p-5 rounded-xl shadow-hard-xs hover:shadow-hard-sm hover:-translate-y-0.5 transition-all"
            >
              <Headphones className="size-5 text-terracotta mb-2" />
              <h2 className="font-heading text-sm font-bold uppercase mb-1">Browse 10 Genres</h2>
              <p className="font-mono text-xs text-muted-foreground">
                Explore 69+ Bengali & English audiobooks and podcasts.
              </p>
            </Link>

            <Link
              href="/account"
              className="border-[1.5px] border-ink bg-card p-5 rounded-xl shadow-hard-xs hover:shadow-hard-sm hover:-translate-y-0.5 transition-all"
            >
              <ShieldCheck className="size-5 text-terracotta mb-2" />
              <h2 className="font-heading text-sm font-bold uppercase mb-1">Account & Plan</h2>
              <p className="font-mono text-xs text-muted-foreground">
                Manage your profile, taste preferences, and subscription tier.
              </p>
            </Link>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold uppercase tracking-tight border-b-[1.5px] border-ink pb-2">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {FAQS.map((item) => (
                <div
                  key={item.q}
                  className="border-[1.5px] border-ink bg-card p-5 rounded-xl shadow-hard-xs"
                >
                  <h3 className="font-heading text-sm font-bold text-foreground mb-1.5">
                    {item.q}
                  </h3>
                  <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-[1.5px] border-ink bg-card p-5 rounded-xl shadow-hard-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted border-[1.5px] border-ink flex items-center justify-center shrink-0">
                <Mail className="size-5 text-terracotta" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold">Still need assistance?</h3>
                <p className="font-mono text-xs text-muted-foreground">
                  Reach our team at support@golpobook.app
                </p>
              </div>
            </div>
            <Link
              href="/audiobooks"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-terracotta text-white border-[1.5px] border-ink font-sans text-xs font-bold uppercase shadow-hard-2xs hover:bg-terracotta-dark"
            >
              <span>Back to Catalog</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
