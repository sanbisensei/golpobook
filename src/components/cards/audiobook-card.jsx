"use client";

import Image from "next/image";
import { Star, Bookmark, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AudiobookCard({ book, onSelect, isSelected = false }) {
  return (
    <article
      onClick={() => onSelect?.(book)}
      className={`group flex flex-col cursor-pointer select-none transition-all duration-150 ${
        isSelected ? "ring-2 ring-terracotta ring-offset-2 p-1 bg-muted/40" : ""
      }`}
    >
      {/* Book Cover Mount with 1.5px black border and tactile hover physics */}
      <div className="w-full aspect-[2/3] bg-muted border-[1.5px] border-ink overflow-hidden shadow-hard-xs group-hover:-translate-x-0.5 group-hover:-translate-y-1 group-hover:shadow-hard-md transition-all duration-200 ease-out relative">
        <Image
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Tier Chip */}
        <div className="absolute top-2 left-2 z-10">
          {book.tier === "premium" && (
            <Badge variant="premium">PREMIUM</Badge>
          )}
          {book.tier === "plus" && (
            <Badge variant="plus">PLUS</Badge>
          )}
          {book.tier === "free" && (
            <Badge variant="free">FREE</Badge>
          )}
        </div>

        {/* Quick Play Trigger Overlay */}
        <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="size-11 rounded-none bg-terracotta text-white border-[1.5px] border-ink shadow-hard-xs flex items-center justify-center transform group-hover:scale-110 active:scale-95 transition-transform duration-150">
            <Play className="size-5 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Metadata Tier */}
      <div className="mt-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-heading text-xs sm:text-sm leading-tight text-foreground font-bold line-clamp-1 group-hover:text-terracotta transition-colors duration-150">
            {book.title}
          </h4>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate">
            {book.author}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-ink/20 text-xs">
          <div className="flex items-center gap-1 text-ink-muted">
            <Star className="size-3.5 fill-amber text-ink" />
            <span className="font-mono text-[11px] font-bold text-foreground">
              {book.rating}
            </span>
          </div>

          <span className="font-mono text-[10px] text-muted-foreground">
            {book.duration}
          </span>
        </div>
      </div>
    </article>
  );
}
