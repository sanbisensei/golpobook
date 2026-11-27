"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";

/**
 * REQ-32: House ad / upgrade banner displayed for Free & Guest tiers.
 * Hidden automatically for Plus & Premium subscribers.
 */
export function HouseAdBanner({ plan = "free" }) {
  if (plan === "plus" || plan === "premium") return null;

  return (
    <section className="mb-10">
      <div className="border-[1.5px] border-ink bg-muted/50 p-4 md:p-5 rounded-xl shadow-hard-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-canary border-[1.5px] border-ink flex items-center justify-center shrink-0 mt-0.5">
            <Crown className="size-4 text-ink" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-ink text-white font-mono text-[9px] font-bold uppercase">
                SPONSORED • FREE TIER
              </span>
            </div>
            <h4 className="font-heading text-sm md:text-base font-bold text-foreground mt-1">
              Go Ad-Free &amp; Unlock 2.0x Speed + Offline Listening
            </h4>
            <p className="font-mono text-xs text-muted-foreground">
              Upgrade to GolpoBook Plus or Premium starting at ৳149/month via bKash, Nagad, or Card.
            </p>
          </div>
        </div>

        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-canary text-ink border-[1.5px] border-ink font-sans text-xs font-bold uppercase tracking-wider shadow-hard-2xs hover:bg-canary-light shrink-0"
        >
          <Sparkles className="size-3.5 text-terracotta" />
          <span>View Plans</span>
        </Link>
      </div>
    </section>
  );
}
