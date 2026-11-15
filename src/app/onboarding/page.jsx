import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata = {
  title: "Personalize Your Listening — GolpoBook",
  description: "Customize your language, genre, and topic preferences for personalized audiobook recommendations.",
};

async function OnboardingDataLoader() {
  const supabase = await createClient();

  // 1. Authenticate user server-side
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirectTo=/onboarding");
  }

  // 2. Query real categories from database
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  // 3. Query existing user preferences if any
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <OnboardingWizard
      user={user}
      initialCategories={categories || []}
      initialPreferences={preferences}
    />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="size-8 bg-terracotta animate-pulse border-[1.5px] border-ink" />
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-4">
            Loading your listening preferences...
          </p>
        </div>
      }
    >
      <OnboardingDataLoader />
    </Suspense>
  );
}
