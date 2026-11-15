"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Library,
  Bookmark,
  Sparkles,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Browse", href: "/audiobooks", icon: Compass },
  { label: "Story AI", href: "/story-finder", icon: Sparkles, badge: "AI" },
  { label: "Library", href: "/library", icon: Library },
  { label: "Saved", href: "/saved", icon: Bookmark },
];

export function NavigationRail() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-20 bg-background z-40 border-r-[1.5px] border-ink hidden md:flex flex-col justify-between py-4 select-none">
      {/* Primary Nav Links */}
      <nav className="flex flex-col items-center gap-2 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-16 py-2.5 flex flex-col items-center justify-center transition-all duration-150 ease-out border-[1.5px] border-transparent text-muted-foreground rounded-none relative group",
                isActive
                  ? "bg-terracotta text-white font-bold border-ink shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:text-white"
                  : "hover:border-ink hover:bg-card hover:text-foreground hover:shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              )}
            >
              <Icon className="size-5 transition-transform duration-150 group-hover:scale-110" />
              <span className="font-sans text-[9px] uppercase tracking-wider mt-1 leading-none font-bold">
                {item.label}
              </span>
              {item.badge && !isActive && (
                <span className="absolute top-1 right-2 px-1 bg-canary text-ink text-[8px] font-bold border border-ink leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Utility Links */}
      <div className="flex flex-col items-center gap-2 px-2 border-t-[1.5px] border-ink/20 pt-3">
        <Link
          href="/support"
          className="w-16 py-2 flex flex-col items-center justify-center border-[1.5px] border-transparent text-muted-foreground hover:border-ink hover:bg-card hover:text-foreground hover:shadow-hard-xs hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 ease-out rounded-none"
          title="Support"
        >
          <LifeBuoy className="size-5" />
          <span className="font-sans text-[9px] uppercase tracking-wider mt-1 font-bold">Help</span>
        </Link>
      </div>
    </aside>
  );
}
