"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Bell,
  User,
  Flame,
  Menu,
  LogOut,
  BookOpen,
  ChevronDown,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const HEADER_CATEGORIES = [
  { slug: "all", name: "All Genres" },
  { slug: "adventure-thriller", name: "Adventure & Thriller" },
  { slug: "classic-literature", name: "Classic Literature" },
  { slug: "mystery-detective", name: "Mystery & Detective" },
  { slug: "supernatural-horror", name: "Supernatural & Horror" },
  { slug: "magical-realism", name: "Magical Realism" },
  { slug: "dystopian-sci-fi", name: "Dystopian Sci-Fi" },
  { slug: "podcasts", name: "Podcasts" },
  { slug: "e-learning", name: "E-Learning" },
  { slug: "historical-liberation-war", name: "Historical & 1971" },
  { slug: "romance-drama", name: "Romance & Drama" },
];

export function TopHeader() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateToSearch = (q = searchQuery, cat = selectedCategory) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat && cat !== "all") params.set("category", cat);
    const qs = params.toString();
    setIsSearchOpen(false);
    router.push(qs ? `/audiobooks?${qs}` : "/audiobooks");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigateToSearch(searchQuery, selectedCategory);
  };

  useEffect(() => {
    const supabase = createClient();

    // 1. Initial user session check
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });

    // 2. Reactive auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Derive display initials and name
  const fullName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Listener";

  const initials = fullName
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "GB";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background z-50 border-b border-ink px-4 md:px-6 flex items-center justify-between select-none">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          className="md:hidden size-9 border-[1.5px] border-ink bg-card rounded-lg flex items-center justify-center text-foreground shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
          type="button"
          aria-label="Open Navigation Menu"
        >
          <Menu className="size-5" />
        </button>

        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-8 bg-terracotta text-white flex items-center justify-center border-[1.5px] border-ink rounded-lg shadow-hard-xs group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-hard-sm transition-all duration-150">
            <Flame className="size-5 fill-white" />
          </div>
          <span className="font-heading text-lg md:text-xl font-bold tracking-tight text-foreground uppercase">
            Golpo<span className="text-terracotta">Book</span>
          </span>
        </Link>
      </div>

      {/* Center Search Strip (Vivid Canary Yellow) with Click-to-Filter Categories */}
      <div className="flex-1 max-w-xl mx-4 hidden md:flex items-center gap-2">
        <div ref={searchBoxRef} className="relative flex-1">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <div className="absolute left-3 pointer-events-none flex items-center text-ink-muted">
              <Search className="size-4" />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-9 pl-9 pr-8 bg-canary text-ink border-[1.5px] border-ink rounded-lg font-mono text-xs placeholder:text-ink-muted/80 focus:outline-none focus:bg-card shadow-hard-xs focus:shadow-hard-sm focus:-translate-y-0.5 transition-all duration-150"
              placeholder="Search title, author, or click to filter genres..."
              type="text"
            />
            {(searchQuery || selectedCategory !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                aria-label="Clear search"
                className="absolute right-2.5 text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>

          {/* Click-to-Filter Category Popover */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-11 z-50 bg-card border-[1.5px] border-ink rounded-xl shadow-hard-md p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-ink/15 pb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Filter by Genre
                </span>
                {selectedCategory !== "all" && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className="font-mono text-[10px] text-terracotta hover:underline cursor-pointer"
                  >
                    Reset Genre
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {HEADER_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        navigateToSearch(searchQuery, cat.slug);
                      }}
                      className={`px-2.5 py-1 rounded-md border-[1.5px] border-ink font-sans text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        active
                          ? "bg-terracotta text-white shadow-hard-2xs"
                          : "bg-muted/60 text-foreground hover:bg-canary hover:text-ink"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-ink/15 gap-2">
                <button
                  type="button"
                  onClick={() => navigateToSearch(searchQuery, selectedCategory)}
                  className="px-3 py-1.5 rounded-lg bg-terracotta text-white border-[1.5px] border-ink font-sans text-[10px] font-bold uppercase tracking-wider shadow-hard-2xs hover:bg-terracotta-dark cursor-pointer"
                >
                  {searchQuery.trim() ? `Search "${searchQuery.trim()}"` : "Browse Selected Genre"}
                </button>
                <Link
                  href="/story-finder"
                  onClick={() => setIsSearchOpen(false)}
                  className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-terracotta hover:underline"
                >
                  <Sparkles className="size-3" />
                  <span>Try AI Mood Search</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* AI Story Finder Trigger Button */}
        <Link
          href="/story-finder"
          className="flex items-center gap-1.5 h-9 px-3 bg-canary text-ink font-sans text-[11px] font-bold uppercase tracking-wider border-[1.5px] border-ink rounded-lg shadow-hard-xs hover:bg-canary-light hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 group shrink-0"
          title="Ask AI Story Finder in Bangla or Banglish"
        >
          <Sparkles className="size-3.5 text-terracotta transition-transform group-hover:scale-110" />
          <span className="whitespace-nowrap">Story Finder</span>
          <span className="px-1 py-0.2 bg-terracotta text-white text-[8px] font-bold border border-ink rounded leading-tight">
            AI
          </span>
        </Link>
      </div>

      {/* Right User Actions & Auth State */}
      <div className="flex items-center gap-3">
        <button
          className="size-9 border-[1.5px] border-ink bg-card rounded-lg flex items-center justify-center text-foreground hover:bg-muted shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm relative active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
          type="button"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 bg-terracotta border border-ink" />
        </button>

        {/* Auth State Switcher */}
        {loading ? (
          <div className="flex items-center gap-2 pl-3 border-l-[1.5px] border-ink">
            <div className="size-8 bg-muted border-[1.5px] border-ink rounded-lg animate-pulse" />
            <div className="hidden lg:flex flex-col gap-1">
              <div className="h-3 w-16 bg-muted animate-pulse border border-ink/20" />
              <div className="h-2.5 w-12 bg-muted animate-pulse border border-ink/20" />
            </div>
          </div>
        ) : user ? (
          /* Authenticated Listener Profile Dropdown */
          <div className="pl-3 border-l-[1.5px] border-ink">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 outline-none text-left cursor-pointer group"
                aria-label="User account menu"
              >
                <div className="size-8 bg-terracotta border-[1.5px] border-ink rounded-lg flex items-center justify-center text-white font-bold font-mono text-xs shadow-hard-xs group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150">
                  {initials}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-none">
                  <span className="font-heading text-xs font-bold uppercase tracking-wider text-foreground truncate max-w-[120px]">
                    {fullName}
                  </span>
                  <span className="font-mono text-[10px] text-terracotta font-bold uppercase mt-0.5">
                    Free Explorer
                  </span>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground hidden sm:block transition-colors" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel className="font-mono text-xs text-muted-foreground border-b border-ink/15 pb-2">
                  <span className="block font-heading font-bold text-xs uppercase text-foreground truncate">
                    {fullName}
                  </span>
                  <span className="block text-[10px] text-muted-foreground truncate">
                    {user.email}
                  </span>
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-canary text-ink border border-ink font-mono text-[9px] font-bold uppercase">
                    Free Explorer
                  </span>
                </DropdownMenuLabel>

                <DropdownMenuGroup className="py-1">
                  <DropdownMenuItem
                    onClick={() => router.push("/library")}
                    className="cursor-pointer"
                  >
                    <BookOpen className="size-4 text-terracotta" />
                    <span>My Library</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/account")}
                    className="cursor-pointer"
                  >
                    <User className="size-4 text-muted-foreground" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                  className="text-terracotta hover:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="size-4 text-terracotta" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          /* Unauthenticated Guest Actions */
          <div className="flex items-center gap-2 pl-3 border-l border-ink">
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="font-heading text-xs uppercase tracking-wider h-8 px-3"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                variant="primary"
                size="sm"
                className="font-heading text-xs uppercase tracking-wider h-8 px-3 hidden sm:inline-flex"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
