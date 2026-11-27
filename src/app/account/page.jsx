import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountView } from "@/components/account/account-view";

export const metadata = {
  title: "Account & Subscription — GolpoBook",
  description: "Manage your GolpoBook profile, listening taste, and subscription tier.",
};

async function AccountDataLoader() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirectTo=/account");
  }

  const [{ data: profile }, { data: subscription }, { data: preferences }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  return (
    <AccountView
      user={user}
      profile={profile}
      subscription={subscription}
      preferences={preferences}
    />
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs uppercase text-muted-foreground">
          Loading account...
        </div>
      }
    >
      <AccountDataLoader />
    </Suspense>
  );
}
