"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // 1. Client-Side Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Sign up through Supabase Auth
      // The PostgreSQL trigger handle_new_user() automatically creates:
      // 1. public.profiles record with role='listener'
      // 2. public.user_subscriptions record with plan_id='free', status='active'
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      // Check whether email confirmation is required or already confirmed
      const user = data.user;
      if (user && user.identities && user.identities.length === 0) {
        // User already exists with this email
        setErrorMessage("An account with this email address already exists. Please log in.");
        setLoading(false);
        return;
      }

      if (data.session) {
        // Email confirmation is disabled in Supabase project; user is immediately authenticated
        router.push("/onboarding");
        router.refresh();
      } else {
        // Email confirmation is enabled; show confirmation notification card
        setSuccessInfo({
          email: email.trim(),
          message:
            "A verification link has been sent to your email address. Please click the link to activate your GolpoBook account.",
        });
      }
    } catch (err) {
      setErrorMessage(
        err.message || "An unexpected error occurred during registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // State: Registration Succeeded with Email Confirmation Pending
  if (successInfo) {
    return (
      <div className="bg-card border-[1.5px] border-ink p-6 sm:p-8 shadow-hard-lg hover:shadow-hard-xl transition-all duration-200">
        <div className="size-12 bg-canary text-ink border-[1.5px] border-ink shadow-hard-xs flex items-center justify-center mb-5">
          <CheckCircle2 className="size-6 text-terracotta" />
        </div>

        <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Check Your Inbox
        </h2>

        <p className="font-mono text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
          We’ve dispatched an activation link to{" "}
          <span className="font-bold text-foreground underline">{successInfo.email}</span>.
        </p>

        <div className="my-6 p-4 bg-muted/50 border-[1.5px] border-ink shadow-hard-xs text-xs font-mono text-muted-foreground space-y-2">
          <p>• Click the link inside the email to verify your address.</p>
          <p>• Once verified, your account and Free Explorer tier will be immediately active.</p>
          <p>• Check your spam or promotions folder if the email does not appear in 2 minutes.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/login" className="w-full">
            <Button variant="primary" className="w-full gap-2">
              <span>Go to Sign In</span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setSuccessInfo(null)}
            className="w-full"
          >
            Register Another Email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-[1.5px] border-ink p-6 sm:p-8 shadow-hard-lg hover:shadow-hard-xl transition-all duration-200">
      {/* Form Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-muted border-[1.5px] border-ink shadow-hard-2xs text-[10px] font-mono text-muted-foreground uppercase mb-2">
          <Sparkles className="size-3 text-terracotta" />
          <span>Free Explorer Account</span>
        </div>
        <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Create Listener Account
        </h2>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          Join GolpoBook to stream Bengali audiobooks and discover stories by mood.
        </p>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-destructive/10 border-[1.5px] border-destructive shadow-hard-xs text-destructive font-mono text-xs flex items-start gap-2.5 animate-in fade-in-50">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block font-heading text-xs font-bold uppercase tracking-wider text-foreground mb-1.5"
          >
            Full Name
          </label>
          <div className="relative">
            <Input
              id="fullName"
              type="text"
              required
              disabled={loading}
              placeholder="e.g. Sabyasachi Sen"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-9"
            />
            <User className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

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
          <label
            htmlFor="password"
            className="block font-heading text-xs font-bold uppercase tracking-wider text-foreground mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              placeholder="At least 6 characters"
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

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block font-heading text-xs font-bold uppercase tracking-wider text-foreground mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-9"
            />
            <Lock className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Legal Disclaimer */}
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed pt-1">
          By registering, you agree to the GolpoBook Terms of Service. Your account will automatically initialize on the Free Explorer tier.
        </p>

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
              <span className="font-mono text-xs tracking-normal">Creating Account...</span>
            ) : (
              <>
                <UserPlus className="size-4" />
                <span>Create Account</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Footer Switch to Sign In */}
      <div className="mt-6 pt-5 border-t border-ink/20 text-center font-mono text-xs text-muted-foreground">
        Already have a GolpoBook account?{" "}
        <Link
          href="/login"
          className="text-terracotta font-bold hover:underline underline-offset-4 ml-1"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
