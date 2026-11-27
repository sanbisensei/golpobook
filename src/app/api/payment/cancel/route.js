import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function handleCancel(request) {
  const { searchParams } = new URL(request.url);
  let tranId = searchParams.get("tran_id");
  if (request.method === "POST") {
    const form = await request.formData().catch(() => null);
    if (form) tranId = form.get("tran_id") || tranId;
  }
  if (tranId) {
    const admin = createAdminClient();
    await admin
      .from("payment_transactions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("tran_id", tranId)
      .eq("status", "pending");
  }
  return NextResponse.redirect(new URL(`/pricing?payment=cancelled&tran_id=${tranId || ""}`, request.url), {
    status: 303,
  });
}

export async function GET(request) {
  return handleCancel(request);
}
export async function POST(request) {
  return handleCancel(request);
}
