"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "ALL", label: "All", emoji: "✨" },
  { value: "TECHNICAL", label: "Technical", emoji: "💻" },
  { value: "CULTURAL", label: "Cultural", emoji: "🎭" },
  { value: "WORKSHOP", label: "Workshop", emoji: "🔧" },
  { value: "SEMINAR", label: "Seminar", emoji: "🎤" },
  { value: "HACKATHON", label: "Hackathon", emoji: "🚀" },
  { value: "SPORTS", label: "Sports", emoji: "⚽" },
  { value: "SOCIAL", label: "Social", emoji: "🎉" },
  { value: "OTHER", label: "Other", emoji: "📋" },
] as const;

const SORT_OPTIONS = [
  { value: "date-asc", label: "Date: Soonest" },
  { value: "date-desc", label: "Date: Latest" },
  { value: "registrations", label: "Most Popular" },
  { value: "title", label: "Title: A–Z" },
] as const;

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "ALL";
  const sort = searchParams.get("sort") || "date-asc";

  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "ALL" && value !== "date-asc") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const query = params.toString();
      router.push(query ? `/events?${query}` : "/events");
    },
    [router, searchParams]
  );

  // Properly debounced search — single pending timer, cleared on each keystroke.
  useEffect(() => {
    if (searchValue === q) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: searchValue });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, q, updateParams]);

  const clearFilters = () => {
    setSearchValue("");
    router.push("/events");
  };

  const hasActiveFilters = q || category !== "ALL" || sort !== "date-asc";

  return (
    <div className="mb-8 space-y-3">
      {/* Row 1: search + sort + clear */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events, venues, descriptions…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select value={sort} onValueChange={(value) => updateParams({ sort: value })}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="gap-1.5"
            title="Clear filters"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Row 2: category chips */}
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter by category"
      >
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => updateParams({ category: cat.value })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
              )}
            >
              <span aria-hidden>{cat.emoji}</span>
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
