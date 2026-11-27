import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PricingView } from "@/components/pricing/pricing-view";

export const metadata = {
  title: "Pricing & Plans — GolpoBook",
  description: "Choose Free, Plus (৳20/month), or Premium (৳120/month) for unlimited audiobooks and AI Story Finder.",
};

async function PricingDataLoader({ searchParams }) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan = "free";
  if (user) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("plan_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    currentPlan = sub?.plan_id || "free";
  }

  const sp = await searchParams;

  return (
    <PricingView
      currentPlan={currentPlan}
      isLoggedIn={Boolean(user)}
      paymentStatus={sp?.payment || null}
    />
  );
}

export default function PricingPage({ searchParams }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs uppercase text-muted-foreground">
          Loading plans...
        </div>
      }
    >
      <PricingDataLoader searchParams={searchParams} />
    </Suspense>
  );
}
