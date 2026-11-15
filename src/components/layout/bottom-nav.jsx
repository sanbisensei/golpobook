"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Sparkles, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { label: "Home", href: "/", icon: Home },
  { label: "Browse", href: "/audiobooks", icon: Compass },
  { label: "AI Search", href: "/story-finder", icon: Sparkles },
  { label: "Library", href: "/library", icon: Library },
  { label: "Account", href: "/account", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-background border-t border-ink z-40 flex items-center justify-around px-2 select-none">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 text-muted-foreground transition-colors",
              isActive && "text-terracotta font-bold"
            )}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-sans uppercase tracking-wider mt-0.5">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
