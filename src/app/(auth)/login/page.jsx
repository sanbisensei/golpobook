"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Derived notification messages from URL searchParams or component state
  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");
  const activeError = errorMessage || urlError;
  const activeInfo = infoMessage || urlMessage;

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Invalid email or password. Please verify your credentials.");
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage(
            "Your email address has not been confirmed yet. Please check your inbox for the activation link."
          );
        } else {
          setErrorMessage(error.message);
        }
        setLoading(false);
        return;
      }

      // Safe destination redirect (prevent open redirects)
      const rawRedirect = searchParams.get("redirectTo");
      let destination = "/";
      if (
        rawRedirect &&
        rawRedirect.startsWith("/") &&
        !rawRedirect.startsWith("//") &&
        !rawRedirect.includes("\\")
      ) {
        destination = rawRedirect;
      }

      router.push(destination);
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err.message || "An unexpected error occurred during login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border-[1.5px] border-ink p-6 sm:p-8 shadow-hard-lg hover:shadow-hard-xl transition-all duration-200">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-muted border-[1.5px] border-ink shadow-hard-2xs text-[10px] font-mono text-muted-foreground uppercase mb-2">
          <Sparkles className="size-3 text-terracotta" />
          <span>Listener Portal</span>
        </div>
        <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Sign In to GolpoBook
        </h2>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          Access your personalized library, continue listening, and discover stories.
        </p>
      </div>

      {/* Info Notice Banner */}
      {activeInfo && (
        <div className="mb-5 p-3.5 bg-canary/20 border-[1.5px] border-ink shadow-hard-xs text-ink font-mono text-xs flex items-start gap-2.5 animate-in fade-in-50">
          <CheckCircle2 className="size-4 text-terracotta shrink-0 mt-0.5" />
          <span className="leading-snug">{activeInfo}</span>
        </div>
      )}

      {/* Error Alert Box */}
      {activeError && (
        <div className="mb-5 p-3.5 bg-destructive/10 border-[1.5px] border-destructive shadow-hard-xs text-destructive font-mono text-xs flex items-start gap-2.5 animate-in fade-in-50">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{activeError}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Address */}
        <div>
          <label
            htmlFor="email"
            className="block font-heading text-xs font-bold uppercase tracking-wider text-foreground mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              required
              disabled={loading}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
            <Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="font-heading text-xs font-bold uppercase tracking-wider text-foreground"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="font-mono text-[11px] text-muted-foreground hover:text-terracotta transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10"
            />
            <Lock className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <span className="font-mono text-xs tracking-normal">Signing In...</span>
            ) : (
              <>
                <LogIn className="size-4" />
                <span>Sign In</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Footer Switch to Register */}
      <div className="mt-6 pt-5 border-t border-ink/20 text-center font-mono text-xs text-muted-foreground">
        New to GolpoBook?{" "}
        <Link
          href="/register"
          className="text-terracotta font-bold hover:underline underline-offset-4 ml-1"
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-card border border-ink p-6 sm:p-8 shadow-hard-md animate-pulse">
          <div className="h-5 w-28 bg-muted border border-ink/20 mb-3" />
          <div className="h-7 w-48 bg-muted border border-ink/20 mb-6" />
          <div className="space-y-4">
            <div className="h-10 bg-muted border border-ink/20" />
            <div className="h-10 bg-muted border border-ink/20" />
            <div className="h-10 bg-terracotta/40 border border-ink/20" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
