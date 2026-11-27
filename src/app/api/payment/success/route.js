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
    await admin.rpc("activate_user_subscription", {
      p_tran_id: tranId,
      p_val_id: valId || `SIM-${Date.now()}`,
      p_payment_method: method,
      p_payload: { source: "success_callback" },
    });
  }

  return NextResponse.redirect(new URL(`/account?payment=success&tran_id=${tranId || ""}`, request.url));
}

export async function GET(request) {
  return handleSuccess(request);
}

export async function POST(request) {
  return handleSuccess(request);
}
