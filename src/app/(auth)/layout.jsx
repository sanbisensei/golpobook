import Link from "next/link";
import { Flame, ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Top Minimal Header */}
      <header className="h-14 border-b border-ink px-4 md:px-8 flex items-center justify-between bg-card z-10 select-none">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-7 bg-terracotta text-white flex items-center justify-center border border-ink shadow-hard-xs group-hover:-translate-y-0.5 transition-transform">
            <Flame className="size-4 fill-white" />
          </div>
          <span className="font-heading text-base md:text-lg font-bold tracking-tight text-foreground uppercase">
            Golpo<span className="text-terracotta">Book</span>
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Catalog</span>
        </Link>
      </header>

      {/* Centered Authentication Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
