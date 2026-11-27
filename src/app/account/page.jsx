import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountView } from "@/components/account/account-view";

export const metadata = {
  title: "Account & Subscription — GolpoBook",
  description: "Manage your GolpoBook profile, listening taste, and subscription tier.",
};

async function AccountDataLoader({ searchParams }) {
  const sp = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirectTo=/account");
  }

  const [
    { data: profile },
    { data: subscription },
    { data: preferences },
    { data: transactionsData, error: txError },
  ] = await Promise.all([
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
    supabase
      .from("payment_transactions")
      .select("id, tran_id, plan_id, billing_cycle, amount, currency, status, payment_method, bank_tran_id, created_at, verified_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const transactions = txError ? [] : transactionsData || [];

  return (
    <AccountView
      user={user}
      profile={profile}
      subscription={subscription}
      preferences={preferences}
      transactions={transactions}
      paymentStatus={sp?.payment || null}
    />
  );
}

export default function AccountPage({ searchParams }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs uppercase text-muted-foreground">
          Loading account...
        </div>
      }
    >
      <AccountDataLoader searchParams={searchParams} />
    </Suspense>
  );
}
