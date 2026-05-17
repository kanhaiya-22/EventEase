"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AiSuggestResponse } from "@/lib/validators/event-ai";

const EXAMPLE_PROMPTS = [
  "Web3 workshop for first-year CSE students next Saturday afternoon",
  "Intra-college coding hackathon over a weekend with cash prizes",
  "Cultural night with music, dance and food stalls in early June",
];

interface AiEventAssistProps {
  onSuggestion: (suggestion: AiSuggestResponse) => void;
  onClearAiFill?: () => void;
  disabled?: boolean;
}

export function AiEventAssist({
  onSuggestion,
  onClearAiFill,
  disabled,
}: AiEventAssistProps) {
  const [open, setOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<AiSuggestResponse | null>(null);

  const handleClear = () => {
    if (onClearAiFill) onClearAiFill();
    setLastResult(null);
    setError("");
  };

  const handleGenerate = async () => {
    if (prompt.trim().length < 10) {
      setError("Please describe your event idea in at least 10 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/events/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate suggestion");
      }

      const suggestion = data.suggestion as AiSuggestResponse;
      setLastResult(suggestion);
      onSuggestion(suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="pt-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-base font-semibold text-blue-900">
                Generate with AI
              </h3>
              <p className="text-xs text-blue-700/80">
                Describe your event in a sentence — we&apos;ll draft the rest.
              </p>
            </div>
          </div>
          {open ? (
            <ChevronUp className="h-5 w-5 text-blue-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-600" />
          )}
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="ai-prompt" className="sr-only">
                Event idea
              </Label>
              <textarea
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., AI/ML workshop for beginners next Saturday afternoon"
                rows={3}
                disabled={loading || disabled}
                maxLength={1000}
                className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="mt-1 flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    disabled={loading || disabled}
                    className="rounded-full border border-blue-200 bg-white/60 px-2.5 py-0.5 text-xs text-blue-700 hover:bg-white hover:border-blue-400 disabled:opacity-50"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            {lastResult && !error && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                Filled empty fields with AI suggestions. Review and edit before
                publishing.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={loading || disabled || prompt.trim().length < 10}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {lastResult ? "Regenerate" : "Generate"}
                  </>
                )}
              </Button>
              {onClearAiFill && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  disabled={loading || disabled}
                  className="border-blue-300 text-blue-700 hover:bg-white"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Clear AI fill
                </Button>
              )}
              <p className="text-xs text-blue-700/70">
                Only empty form fields will be filled.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
