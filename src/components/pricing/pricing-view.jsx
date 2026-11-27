"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { NavigationRail } from "@/components/layout/navigation-rail";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  {
    id: "free",
    name: "Free Explorer",
    badge: "FREE",
    monthly: 0,
    yearly: 0,
    desc: "Explore Free catalog + Chapter 1 previews with ads.",
    features: [
      "Free catalog + Chapter 1 previews of paid books",
      "1.0x playback speed (no offline downloads)",
      "1 AI Story Finder (RAG) search / day",
      "Limited bookmarks & playlists (no cross-device sync)",
      "Includes house sponsor ads",
    ],
  },
  {
    id: "plus",
    name: "GolpoBook Plus",
    badge: "POPULAR",
    monthly: 20,
    yearly: 200,
    desc: "Ad-free listening, 1.5x speed, 1 offline download & AI summaries.",
    features: [
      "Full Plus catalog + limited Exclusive titles",
      "100% Ad-free listening across the app",
      "Up to 1.5x playback speed + Sleep Timer",
      "Offline download: 1 chapter/podcast cached",
      "Unlimited bookmarks + Cross-device sync",
      "10 AI Story Finder searches/day + 5 AI Summaries/mo",
    ],
  },
  {
    id: "premium",
    name: "GolpoBook Premium",
    badge: "BEST VALUE",
    monthly: 120,
    yearly: 1200,
    desc: "Everything unlocked: 2.0x speed, chapter-wise downloads & unlimited AI.",
    features: [
      "Full catalog + ALL Exclusive audiobooks & podcasts",
      "100% Ad-free listening experience",
      "Up to 2.0x playback speed + Sleep Timer",
      "Chapter-wise offline downloads (unlimited)",
      "Unlimited bookmarks + Cross-device sync",
      "Unlimited AI Story Finder + 30 AI Summaries/mo",
    ],
  },
];

export function PricingView({ currentPlan = "free", isLoggedIn = false, paymentStatus = null }) {
  const router = useRouter();
  const [cycle, setCycle] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCheckout = async (planId) => {
    if (planId === "free") {
      router.push(isLoggedIn ? "/account" : "/register");
      return;
    }
    if (!isLoggedIn) {
      router.push("/login?redirectTo=/pricing");
      return;
    }

    setLoadingPlan(planId);
    setErrorMsg("");

    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle: cycle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Could not start checkout.");
        setLoadingPlan(null);
        return;
      }
      if (data.gatewayUrl) {
        if (data.gatewayUrl.startsWith("/")) {
          router.push(data.gatewayUrl);
        } else {
          window.location.assign(data.gatewayUrl);
        }
        return;
      }
      setErrorMsg(data.message || "Payment gateway did not return a checkout URL.");
      setLoadingPlan(null);
    } catch (err) {
      setErrorMsg(err.message || "Network error initiating payment.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <TopHeader />
      <NavigationRail />

      <div className="md:pl-20 min-h-screen pt-16 pb-24 md:pb-12 flex flex-col">
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
          {/* Header */}
          <section className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-canary border-[1.5px] border-ink font-mono text-xs font-bold uppercase shadow-hard-2xs">
              <Crown className="size-3.5 text-terracotta" />
              <span>GolpoBook Membership</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
              Simple, Student-Friendly Pricing
            </h1>
            <p className="font-mono text-xs md:text-sm text-muted-foreground">
              Pay seamlessly with bKash, Nagad, or Card via SSLCommerz Sandbox. Cancel anytime.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="inline-flex items-center p-1 rounded-lg border-[1.5px] border-ink bg-card shadow-hard-xs mt-2">
              <button
                type="button"
                onClick={() => setCycle("monthly")}
                className={`px-4 py-1.5 rounded-md font-sans text-xs font-bold uppercase cursor-pointer transition-colors ${
                  cycle === "monthly" ? "bg-terracotta text-white" : "text-foreground hover:bg-muted"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCycle("yearly")}
                className={`px-4 py-1.5 rounded-md font-sans text-xs font-bold uppercase cursor-pointer transition-colors ${
                  cycle === "yearly" ? "bg-terracotta text-white" : "text-foreground hover:bg-muted"
                }`}
              >
                Yearly (Save 2 Months)
              </button>
            </div>
          </section>

          {paymentStatus === "failed" && (
            <div className="max-w-xl mx-auto p-3.5 rounded-xl border-[1.5px] border-destructive bg-destructive/10 font-mono text-xs text-destructive text-center">
              Payment failed or was declined. No charges were made. Please try again.
            </div>
          )}
          {paymentStatus === "cancelled" && (
            <div className="max-w-xl mx-auto p-3.5 rounded-xl border-[1.5px] border-ink bg-canary/30 font-mono text-xs text-ink text-center">
              Checkout cancelled. You can choose a plan anytime below.
            </div>
          )}
          {errorMsg && (
            <div className="max-w-xl mx-auto p-3.5 rounded-xl border-[1.5px] border-destructive bg-destructive/10 font-mono text-xs text-destructive text-center">
              {errorMsg}
            </div>
          )}

          {/* 3-Tier Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const price = cycle === "yearly" ? plan.yearly : plan.monthly;
              const isCurrent = currentPlan === plan.id;
              const isFeatured = plan.id === "plus";

              return (
                <div
                  key={plan.id}
                  className={`border-[1.5px] border-ink rounded-xl p-6 flex flex-col justify-between transition-all ${
                    isFeatured
                      ? "bg-canary/25 shadow-hard-md"
                      : "bg-card shadow-hard-sm"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-heading text-lg font-bold">{plan.name}</h2>
                      <Badge variant={plan.id === "premium" ? "premium" : plan.id === "plus" ? "plus" : "free"}>
                        {isCurrent ? "CURRENT" : plan.badge}
                      </Badge>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-black text-foreground">
                        ৳{price}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        /{cycle === "yearly" ? "year" : "month"}
                      </span>
                    </div>

                    <p className="font-sans text-sm text-foreground/80 font-medium leading-snug">
                      {plan.desc}
                    </p>

                    <ul className="space-y-3 pt-4 border-t-[1.5px] border-ink/20 font-sans text-sm font-semibold text-foreground">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <span className="size-5 rounded-md bg-terracotta/15 border border-ink/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="size-3.5 text-terracotta stroke-[2.5]" />
                          </span>
                          <span className="leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Button
                      type="button"
                      onClick={() => handleCheckout(plan.id)}
                      disabled={isCurrent || loadingPlan === plan.id}
                      variant={plan.id === "free" ? "outline" : "primary"}
                      className="w-full h-11 gap-2 cursor-pointer"
                    >
                      {loadingPlan === plan.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Connecting SSLCommerz...</span>
                        </>
                      ) : isCurrent ? (
                        <span>Active Plan</span>
                      ) : plan.id === "free" ? (
                        <span>{isLoggedIn ? "Active Baseline" : "Start Free"}</span>
                      ) : (
                        <>
                          <Sparkles className="size-4 fill-white" />
                          <span>Upgrade to {plan.id.toUpperCase()}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>

          <div className="flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground pt-2">
            <ShieldCheck className="size-4 text-terracotta" />
            <span>Secured by SSLCommerz Sandbox • Instant subscription activation via IPN</span>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
