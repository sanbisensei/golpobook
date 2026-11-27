"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Crown, Sparkles, Check, Loader2, LogOut, Sliders, Receipt, CheckCircle2 } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { NavigationRail } from "@/components/layout/navigation-rail";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export function AccountView({
  user,
  profile,
  subscription,
  preferences,
  transactions = [],
  paymentStatus = null,
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || ""
  );
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const paymentBanner = bannerDismissed
    ? null
    : paymentStatus === "success"
    ? {
        type: "success",
        message: "Payment verified! Your GolpoBook subscription is now active.",
      }
    : paymentStatus === "failed"
    ? {
        type: "error",
        message: "Payment failed or could not be verified. No charge was applied.",
      }
    : paymentStatus === "cancelled"
    ? {
        type: "info",
        message: "Checkout was cancelled. You can upgrade anytime from Pricing.",
      }
    : null;

  const activePlan = subscription?.plan_id || "free";

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");
    setErrorMsg("");

    try {
      const supabase = createClient();
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (profErr) {
        setErrorMsg(profErr.message);
      } else {
        await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
        setSavedMsg("Profile updated successfully.");
        router.refresh();
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <TopHeader />
      <NavigationRail />

      <div className="md:pl-20 min-h-screen pt-16 pb-24 md:pb-10 flex flex-col">
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
          {paymentBanner && (
            <div
              className={`border-[1.5px] border-ink rounded-xl p-4 shadow-hard-2xs flex items-center justify-between gap-3 ${
                paymentBanner.type === "success"
                  ? "bg-emerald-50 text-emerald-950"
                  : paymentBanner.type === "error"
                  ? "bg-red-50 text-red-950"
                  : "bg-canary/40 text-ink"
              }`}
            >
              <div className="flex items-center gap-2.5 font-mono text-xs font-bold">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{paymentBanner.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="font-mono text-[11px] uppercase underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-terracotta text-white flex items-center justify-center border-[1.5px] border-ink rounded-lg shadow-hard-2xs">
                <User className="size-5" />
              </div>
              <div>
                <h1 className="font-heading text-xl md:text-2xl font-bold uppercase tracking-tight">
                  Account &amp; Subscription
                </h1>
                <p className="font-mono text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Form (REQ-04) */}
            <section className="border-[1.5px] border-ink bg-card p-6 rounded-xl shadow-hard-sm space-y-4">
              <h2 className="font-heading text-base font-bold uppercase tracking-wider border-b border-ink/15 pb-2">
                Listener Profile
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full h-10 px-3 bg-background border-[1.5px] border-ink rounded-lg font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                    Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.email || ""}
                    className="w-full h-10 px-3 bg-muted/60 border-[1.5px] border-ink/40 rounded-lg font-mono text-xs text-muted-foreground"
                  />
                </div>

                {savedMsg && (
                  <p className="font-mono text-xs text-emerald-700 flex items-center gap-1">
                    <Check className="size-3.5" />
                    <span>{savedMsg}</span>
                  </p>
                )}
                {errorMsg && (
                  <p className="font-mono text-xs text-destructive">{errorMsg}</p>
                )}

                <Button type="submit" disabled={saving} variant="primary" size="default" className="gap-2">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  <span>Save Changes</span>
                </Button>
              </form>
            </section>

            {/* Subscription & Tier Summary */}
            <section className="border-[1.5px] border-ink bg-card p-6 rounded-xl shadow-hard-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-ink/15 pb-2">
                  <h2 className="font-heading text-base font-bold uppercase tracking-wider">
                    Current Plan
                  </h2>
                  <Badge variant={activePlan === "premium" ? "premium" : activePlan === "plus" ? "plus" : "free"}>
                    {activePlan.toUpperCase()} TIER
                  </Badge>
                </div>

                <div className="p-4 rounded-lg bg-canary/30 border-[1.5px] border-ink space-y-1.5 font-mono text-xs">
                  <div className="flex items-center gap-2 font-bold text-ink">
                    <Crown className="size-4 text-terracotta" />
                    <span>
                      {activePlan === "premium"
                        ? "Full Catalog • 2.0x Speed • Unlimited Offline"
                        : activePlan === "plus"
                        ? "Plus Catalog • 1.5x Speed • Sleep Timer • 1 Offline"
                        : "Free Catalog + Chapter 1 Previews • 1.0x Speed"}
                    </span>
                  </div>
                  {subscription?.expires_at && (
                    <p className="text-[11px] text-muted-foreground">
                      Renews / Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">Taste Onboarding:</span>
                    <span className="font-bold">
                      {preferences?.onboarding_completed ? "Calibrated" : "Not Completed"}
                    </span>
                  </div>
                  {preferences?.preferred_languages?.length > 0 && (
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-muted-foreground">Languages:</span>
                      <span className="uppercase font-bold">
                        {preferences.preferred_languages.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card hover:bg-muted border-[1.5px] border-ink font-sans text-xs font-bold uppercase shadow-hard-2xs"
                >
                  <Sliders className="size-3.5" />
                  <span>Edit Taste Profile</span>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-canary text-ink border-[1.5px] border-ink font-sans text-xs font-bold uppercase shadow-hard-2xs"
                >
                  <Sparkles className="size-3.5 text-terracotta" />
                  <span>Upgrade / Compare Plans</span>
                </Link>
              </div>
            </section>
          </div>

          {transactions.length > 0 && (
            <section className="border-[1.5px] border-ink bg-card p-6 rounded-xl shadow-hard-xs space-y-4">
              <div className="flex items-center justify-between border-b border-ink/15 pb-3">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="size-4 text-terracotta" />
                  <span>Payment Receipts</span>
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {transactions.length} recent
                </span>
              </div>

              <div className="divide-y divide-ink/15 border-[1.5px] border-ink rounded-lg overflow-hidden">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-background/40 font-mono text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground uppercase">
                        GolpoBook {tx.plan_id} ({tx.billing_cycle})
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Ref: {tx.tran_id}
                        {tx.payment_method ? ` • ${tx.payment_method}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground">
                        ৳{Number(tx.amount).toLocaleString()} {tx.currency}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border border-ink/30 text-[10px] font-bold uppercase ${
                          tx.status === "valid"
                            ? "bg-emerald-100 text-emerald-900"
                            : tx.status === "pending"
                            ? "bg-canary text-ink"
                            : "bg-red-100 text-red-900"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
