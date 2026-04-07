"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
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

const CATEGORIES = [
  "ALL",
  "TECHNICAL",
  "CULTURAL",
  "WORKSHOP",
  "SEMINAR",
  "HACKATHON",
  "SPORTS",
  "SOCIAL",
  "OTHER",
] as const;

const SORT_OPTIONS = [
  { value: "date-asc", label: "Date: Soonest" },
  { value: "date-desc", label: "Date: Latest" },
  { value: "registrations", label: "Most Registrations" },
  { value: "title", label: "Title: A-Z" },
] as const;

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "ALL";
  const sort = searchParams.get("sort") || "date-asc";

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
      router.push(`/events?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/events");
  };

  const hasActiveFilters = q || category !== "ALL" || sort !== "date-asc";

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search events..."
          defaultValue={q}
          onChange={(e) => {
            const timeout = setTimeout(() => {
              updateParams({ q: e.target.value });
            }, 400);
            return () => clearTimeout(timeout);
          }}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
        />
      </div>

      <Select value={category} onValueChange={(value) => updateParams({ category: value })}>
        <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat === "ALL" ? "All Categories" : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(value) => updateParams({ sort: value })}>
        <SelectTrigger className="w-full sm:w-[200px] bg-slate-800 border-slate-700 text-white">
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
          variant="ghost"
          size="icon"
          onClick={clearFilters}
          className="text-slate-400 hover:text-white"
          title="Clear filters"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
