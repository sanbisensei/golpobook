import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLAN_PRICES = {
  plus: { monthly: 20, yearly: 200, name: "GolpoBook Plus" },
  premium: { monthly: 120, yearly: 1200, name: "GolpoBook Premium" },
};

/**
 * POST /api/payment/initiate
 * Initiates an SSLCommerz Sandbox checkout session (or local sandbox simulator if store keys are unset).
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { planId, billingCycle = "monthly" } = body;

    if (!PLAN_PRICES[planId] || !["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "INVALID_PLAN", message: "Please select Plus or Premium plan." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "Sign in to upgrade your subscription." },
        { status: 401 }
      );
    }

    const amount = PLAN_PRICES[planId][billingCycle];
    const tranId = `GB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const origin = new URL(request.url).origin;

    const admin = createAdminClient();
    const { error: txErr } = await admin.from("payment_transactions").insert({
      user_id: user.id,
      plan_id: planId,
      billing_cycle: billingCycle,
      tran_id: tranId,
      amount,
      currency: "BDT",
      status: "pending",
    });

    if (txErr) {
      return NextResponse.json(
        { error: "LEDGER_ERROR", message: txErr.message },
        { status: 500 }
      );
    }

    const storeId = process.env.SSLCZ_STORE_ID;
    const storePass = process.env.SSLCZ_STORE_PASSWORD;

    // Live SSLCommerz Sandbox when credentials are configured
    if (storeId && storePass) {
      const formData = new URLSearchParams({
        store_id: storeId,
        store_passwd: storePass,
        total_amount: String(amount),
        currency: "BDT",
        tran_id: tranId,
        success_url: `${origin}/api/payment/success?tran_id=${tranId}`,
        fail_url: `${origin}/api/payment/fail?tran_id=${tranId}`,
        cancel_url: `${origin}/api/payment/cancel?tran_id=${tranId}`,
        ipn_url: `${origin}/api/payment/ipn`,
        shipping_method: "NO",
        product_name: `${PLAN_PRICES[planId].name} (${billingCycle})`,
        product_category: "Subscription",
        product_profile: "non-physical-goods",
        cus_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Listener",
        cus_email: user.email || "listener@golpobook.app",
        cus_add1: "Dhaka, Bangladesh",
        cus_city: "Dhaka",
        cus_country: "Bangladesh",
        cus_phone: "01700000000",
      });

      const sslRes = await fetch("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const sslData = await sslRes.json();

      if (sslData?.status === "SUCCESS" && sslData?.GatewayPageURL) {
        return NextResponse.json({
          gatewayUrl: sslData.GatewayPageURL,
          tranId,
          mode: "sslcommerz_sandbox",
        });
      }
    }

    // Built-in SSLCommerz Sandbox Simulator fallback when store keys are not set
    return NextResponse.json({
      gatewayUrl: `/pricing/checkout?tran_id=${tranId}&plan=${planId}&cycle=${billingCycle}&amount=${amount}`,
      tranId,
      mode: "sandbox_simulator",
    });
  } catch (err) {
    console.error("POST /api/payment/initiate error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
