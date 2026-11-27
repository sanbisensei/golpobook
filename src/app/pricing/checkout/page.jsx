"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Smartphone, CreditCard, XCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function CheckoutSimulatorInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const tranId = sp.get("tran_id") || "";
  const plan = sp.get("plan") || "plus";
  const cycle = sp.get("cycle") || "monthly";
  const amount = sp.get("amount") || "20";
  const [processing, setProcessing] = useState(false);

  const simulateSuccess = async (method) => {
    setProcessing(true);
    router.push(
      `/api/payment/success?tran_id=${encodeURIComponent(tranId)}&card_type=${encodeURIComponent(method)}`
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md border-[1.5px] border-ink bg-card rounded-xl shadow-hard-md p-6 space-y-5">
        <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-terracotta" />
            <span className="font-heading text-sm font-bold uppercase">
              SSLCommerz Sandbox Simulator
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-canary border border-ink font-mono text-[10px] font-bold">
            TEST MODE
          </span>
        </div>

        <div className="p-4 rounded-lg bg-muted/40 border-[1.5px] border-ink space-y-1 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-bold uppercase">GolpoBook {plan} ({cycle})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transaction ID:</span>
            <span className="font-bold">{tranId}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-ink/15">
            <span className="font-bold">Total Payable:</span>
            <span className="font-black text-terracotta">৳{amount} BDT</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="font-mono text-[11px] uppercase font-bold text-muted-foreground">
            Choose Sandbox Payment Method:
          </p>

          <Button
            onClick={() => simulateSuccess("bKash Sandbox")}
            disabled={processing}
            variant="primary"
            className="w-full h-11 justify-between px-4"
          >
            <span className="flex items-center gap-2">
              {processing ? <Loader2 className="size-4 animate-spin" /> : <Smartphone className="size-4" />}
              <span>Pay with bKash (Test)</span>
            </span>
            <CheckCircle2 className="size-4" />
          </Button>

          <Button
            onClick={() => simulateSuccess("Nagad Sandbox")}
            disabled={processing}
            variant="secondary"
            className="w-full h-11 justify-between px-4"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="size-4" />
              <span>Pay with Nagad (Test)</span>
            </span>
            <CheckCircle2 className="size-4" />
          </Button>

          <Button
            onClick={() => simulateSuccess("VISA Sandbox")}
            disabled={processing}
            variant="outline"
            className="w-full h-11 justify-between px-4"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="size-4" />
              <span>Pay with VISA / Mastercard (Test)</span>
            </span>
            <CheckCircle2 className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-ink/15 font-mono text-xs">
          <a
            href={`/api/payment/fail?tran_id=${encodeURIComponent(tranId)}`}
            className="text-destructive hover:underline inline-flex items-center gap-1"
          >
            <XCircle className="size-3.5" />
            <span>Simulate Failure</span>
          </a>
          <a
            href={`/api/payment/cancel?tran_id=${encodeURIComponent(tranId)}`}
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Cancel Payment
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSimulatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-xs">Loading checkout...</div>}>
      <CheckoutSimulatorInner />
    </Suspense>
  );
}
