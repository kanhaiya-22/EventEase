"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Upload, X, FileText, Sparkles, Loader2 } from "lucide-react";
import { createEvent } from "@/lib/actions/events";
import { AiEventAssist } from "@/components/events/ai-event-assist";
import type { AiSuggestResponse } from "@/lib/validators/event-ai";

function splitIsoDateTime(iso: string): { date: string; time: string } {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  if (match) return { date: match[1], time: match[2] };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

const categories = [
  "TECHNICAL",
  "CULTURAL",
  "WORKSHOP",
  "SEMINAR",
  "HACKATHON",
  "SPORTS",
  "SOCIAL",
  "OTHER",
];

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "TECHNICAL",
    startDate: "",
    startTime: "10:00",
    endDate: "",
    endTime: "18:00",
    venue: "",
    capacity: "",
    posterUrl: "",
    tags: "",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
    waitlistEnabled: true,
  });
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [documents, setDocuments] = useState<Array<{ url: string; name: string }>>([]);
  const [preAiSnapshot, setPreAiSnapshot] = useState<typeof formData | null>(null);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [posterError, setPosterError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      
      // Set the poster URL from the upload
      setFormData((prev) => ({
        ...prev,
        posterUrl: data.fileUrl,
      }));

      // Create preview
      const isVideo = file.type.startsWith("video/");
      setMediaPreview({
        url: data.fileUrl,
        type: isVideo ? "video" : "image",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const clearMedia = () => {
    setMediaPreview(null);
    setFormData((prev) => ({
      ...prev,
      posterUrl: "",
    }));
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);
      formDataToSend.append("type", "document");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      
      // Add document to the list
      setDocuments((prev) => [
        ...prev,
        {
          url: data.fileUrl,
          name: file.name,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAiSuggestion = (s: AiSuggestResponse) => {
    setFormData((prev) => {
      setPreAiSnapshot((existing) => existing ?? prev);
      const start = splitIsoDateTime(s.suggestedStartDate);
      const end = splitIsoDateTime(s.suggestedEndDate);
      const isFreshForm = !prev.title && !prev.description && !prev.venue;

      return {
        ...prev,
        title: prev.title || s.title,
        description: prev.description || s.description,
        category: isFreshForm ? s.category : prev.category,
        startDate: prev.startDate || start.date,
        startTime: prev.startDate ? prev.startTime : start.time || prev.startTime,
        endDate: prev.endDate || end.date,
        endTime: prev.endDate ? prev.endTime : end.time || prev.endTime,
        venue: prev.venue || s.venue,
        capacity: prev.capacity || String(s.suggestedCapacity),
        tags: prev.tags || s.tags.join(", "),
      };
    });
  };

  const handleClearAiFill = () => {
    if (preAiSnapshot) {
      setFormData(preAiSnapshot);
      setPreAiSnapshot(null);
    }
  };

  const handleGeneratePoster = async () => {
    if (!formData.title.trim()) {
      setPosterError("Add an event title first.");
      return;
    }

    setGeneratingPoster(true);
    setPosterError("");

    try {
      const startIso =
        formData.startDate && formData.startTime
          ? `${formData.startDate}T${formData.startTime}:00`
          : undefined;

      const res = await fetch("/api/events/generate-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          category: formData.category,
          tags: formData.tags
            ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
          description: formData.description.trim() || undefined,
          startDate: startIso,
          venue: formData.venue.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate poster");
      }

      setFormData((prev) => ({ ...prev, posterUrl: data.posterUrl }));
      setMediaPreview({ url: data.posterUrl, type: "image" });
    } catch (err) {
      setPosterError(
        err instanceof Error ? err.message : "Failed to generate poster",
      );
    } finally {
      setGeneratingPoster(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Combine date and time
      const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
      const endDateTime = `${formData.endDate}T${formData.endTime}:00`;

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startDate: startDateTime,
        endDate: endDateTime,
        venue: formData.venue,
        capacity: parseInt(String(formData.capacity).trim()),
        waitlistEnabled: formData.waitlistEnabled,
        posterUrl: formData.posterUrl || undefined,
        documents: documents.map((doc) => ({
          url: doc.url,
          name: doc.name,
        })),
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
        status: formData.status,
      };

      const result = await createEvent(payload);

      if (!result.success || !result.event) {
        throw new Error(result.details || result.error || "Failed to create event");
      }

      // Drafts aren't public — send the organizer to their events list.
      // Published events go to the public detail page.
      router.push(
        formData.status === "DRAFT"
          ? "/organized-events"
          : `/events/${result.event.id}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      console.error("Error creating event:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground mt-1">
          Create a new event for your college. Fill in the details below.
        </p>
      </div>

      <AiEventAssist
        onSuggestion={handleAiSuggestion}
        onClearAiFill={preAiSnapshot ? handleClearAiFill : undefined}
        disabled={loading || uploading}
      />

      <Card>
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <span className="font-semibold">Error:</span> {error}
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-base font-semibold">
                Event Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Smart India Hackathon 2025"
                required
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base font-semibold">
                Description *
              </Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event in detail..."
                required
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="text-base font-semibold">
                Category *
              </Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status" className="text-base font-semibold">
                Publish Status *
              </Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
              >
                <option value="PUBLISHED">Publish — visible to students immediately</option>
                <option value="DRAFT">Draft — save privately, publish later</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Drafts are only visible to you in &quot;My Events&quot; and can be published later.
              </p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="startTime" className="text-sm font-semibold">
                  Start Time *
                </Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate" className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date *
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-sm font-semibold">
                  End Time *
                </Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <Label htmlFor="venue" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Venue *
              </Label>
              <Input
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., IET Lucknow Campus, Auditorium A"
                required
                className="mt-2"
              />
            </div>

            {/* Capacity */}
            <div>
              <Label htmlFor="capacity" className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Capacity *
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="e.g., 100"
                required
                min="1"
                className="mt-2"
              />
            </div>

            {/* Waitlist toggle */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.waitlistEnabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      waitlistEnabled: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <div>
                  <p className="text-sm font-semibold">Enable waitlist</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When the event is full, students can join a waitlist and will
                    be auto-promoted (oldest first) if a confirmed registration is
                    cancelled.
                  </p>
                </div>
              </label>
            </div>

            {/* Poster URL */}
            <div>
              <Label className="text-base font-semibold mb-4 block">
                Event Media (Image or Video - Optional)
              </Label>

              {/* AI Poster Generation */}
              <div className="mb-4 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        Generate poster with AI
                      </p>
                      <p className="text-xs text-blue-700/80">
                        Free, no setup. Uses your event title, category, and tags.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleGeneratePoster}
                    disabled={
                      generatingPoster ||
                      uploading ||
                      !formData.title.trim()
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {generatingPoster ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating... (15-30s)
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {formData.posterUrl ? "Regenerate poster" : "Generate poster"}
                      </>
                    )}
                  </Button>
                </div>
                {posterError && (
                  <p className="mt-2 text-xs text-red-700">{posterError}</p>
                )}
                {!formData.title.trim() && (
                  <p className="mt-2 text-xs text-blue-700/70">
                    Fill in the event title above to enable generation.
                  </p>
                )}
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Images: JPEG, PNG, GIF, WebP (max 5MB)
                      </p>
                      <p className="text-xs text-gray-500">
                        Videos: MP4, WebM, MOV (max 50MB)
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Media Preview */}
              {mediaPreview && (
                <div className="mt-6 space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {mediaPreview.type === "image" ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                        <img
                          src={mediaPreview.url}
                          alt="Preview"
                          className="max-w-xs h-auto rounded-lg"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Video Preview:</p>
                        <video
                          src={mediaPreview.url}
                          controls
                          className="max-w-xs h-auto rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearMedia}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Media
                  </Button>
                </div>
              )}

              {uploading && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags" className="text-base font-semibold">
                Tags (Optional)
              </Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., innovation, hackathon, competition (comma-separated)"
                className="mt-2"
              />
            </div>

            {/* Documents/Rulebook */}
            <div>
              <Label className="text-base font-semibold mb-4 block">
                Event Documents / Rulebook (Optional)
              </Label>
              
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, Word, Excel, PowerPoint, or TXT (max 20MB)
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={handleDocumentUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Documents List */}
              {documents.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Uploaded Documents:</p>
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-gray-50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{doc.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading
                  ? "Creating..."
                  : formData.status === "DRAFT"
                    ? "Save as Draft"
                    : "Publish Event"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading || uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
