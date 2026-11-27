"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/account`,
        }
      );
      if (resetErr) {
        setError(resetErr.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto border-[1.5px] border-ink bg-card p-6 sm:p-8 rounded-xl shadow-hard-md space-y-5">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-terracotta mb-4"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Sign In</span>
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
          Reset Password
        </h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          Enter your registered email to receive a password reset link.
        </p>
      </div>

      {sent ? (
        <div className="p-4 border-[1.5px] border-ink bg-canary/35 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-terracotta font-heading text-sm font-bold">
            <CheckCircle2 className="size-4" />
            <span>Reset Link Sent</span>
          </div>
          <p className="font-mono text-xs text-foreground leading-relaxed">
            Check your inbox at <span className="font-bold">{email}</span> for a password reset link.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 border-[1.5px] border-destructive bg-destructive/10 rounded-lg font-mono text-xs text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 pl-9 pr-3 bg-background border-[1.5px] border-ink rounded-lg font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full h-10 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
