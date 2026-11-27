import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function handleSuccess(request) {
  const { searchParams } = new URL(request.url);
  let tranId = searchParams.get("tran_id");
  let valId = searchParams.get("val_id");
  let method = searchParams.get("card_type") || "SSLCommerz";

  if (request.method === "POST") {
    const form = await request.formData().catch(() => null);
    if (form) {
      tranId = form.get("tran_id") || tranId;
      valId = form.get("val_id") || valId;
      method = form.get("card_type") || method;
    }
  }

  if (tranId) {
    const admin = createAdminClient();
    const { data: rpcData, error: rpcErr } = await admin.rpc("activate_user_subscription", {
      p_tran_id: tranId,
      p_val_id: valId || `SIM-${Date.now()}`,
      p_payment_method: method,
      p_payload: { source: "success_callback" },
    });

    // Safe fallback if RPC fails (e.g. schema mismatch before migration re-run)
    if (rpcErr || !rpcData?.ok) {
      if (rpcErr) console.error("activate_user_subscription RPC error:", rpcErr.message);
      const { data: tx } = await admin
        .from("payment_transactions")
        .select("*")
        .eq("tran_id", tranId)
        .maybeSingle();

      if (tx && tx.status !== "validated") {
        const now = new Date();
        const days = tx.billing_cycle === "yearly" ? 365 : 30;
        const expiresAt = new Date(now.getTime() + days * 86400000).toISOString();

        await admin
          .from("payment_transactions")
          .update({
            status: "validated",
            val_id: valId || `SIM-${Date.now()}`,
            payment_method: method,
            raw_gateway_payload: { source: "success_callback_fallback" },
            updated_at: now.toISOString(),
          })
          .eq("id", tx.id);

        await admin
          .from("user_subscriptions")
          .update({ status: "cancelled", updated_at: now.toISOString() })
          .eq("user_id", tx.user_id)
          .eq("status", "active");

        await admin.from("user_subscriptions").insert({
          user_id: tx.user_id,
          plan_id: tx.plan_id,
          billing_cycle: tx.billing_cycle || "monthly",
          status: "active",
          starts_at: now.toISOString(),
          expires_at: expiresAt,
        });
      }
    }
  }

  return NextResponse.redirect(new URL(`/account?payment=success&tran_id=${tranId || ""}`, request.url), {
    status: 303,
  });
}

export async function GET(request) {
  return handleSuccess(request);
}

export async function POST(request) {
  return handleSuccess(request);
}
