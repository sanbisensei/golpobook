import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/payment/ipn
 * Idempotent Instant Payment Notification handler for SSLCommerz Sandbox.
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let payload = {};
    if (contentType.includes("application/json")) {
      payload = await request.json().catch(() => ({}));
    } else {
      const form = await request.formData().catch(() => null);
      if (form) {
        payload = Object.fromEntries(form.entries());
      }
    }

    const tranId = payload.tran_id;
    const valId = payload.val_id;
    const cardType = payload.card_type || payload.payment_method || "bKash / Sandbox";

    if (!tranId) {
      return NextResponse.json({ error: "tran_id required" }, { status: 400 });
    }

    const storeId = process.env.SSLCZ_STORE_ID;
    const storePass = process.env.SSLCZ_STORE_PASSWORD;

    // Validate against SSLCommerz Validation API if sandbox credentials exist and val_id is provided
    if (storeId && storePass && valId) {
      const valUrl = `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePass)}&format=json`;
      const valRes = await fetch(valUrl);
      const valData = await valRes.json();
      if (!valData || !["VALID", "VALIDATED"].includes(valData.status)) {
        return NextResponse.json({ error: "GATEWAY_VALIDATION_FAILED" }, { status: 400 });
      }
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("activate_user_subscription", {
      p_tran_id: tranId,
      p_val_id: valId || `SIM-${Date.now()}`,
      p_payment_method: cardType,
      p_payload: payload,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    console.error("POST /api/payment/ipn error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
