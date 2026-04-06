"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Upload, X, FileText } from "lucide-react";
import { createEvent } from "@/lib/actions/events";

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
  });
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [documents, setDocuments] = useState<Array<{ url: string; name: string }>>([]);

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
        posterUrl: formData.posterUrl || undefined,
        documents: documents.map((doc) => ({
          url: doc.url,
          name: doc.name,
        })),
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
      };

      const result = await createEvent(payload);

      if (!result.success || !result.event) {
        throw new Error(result.details || result.error || "Failed to create event");
      }

      // Success - redirect to event detail page
      router.push(`/events/${result.event.id}`);
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

            {/* Poster URL */}
            <div>
              <Label className="text-base font-semibold mb-4 block">
                Event Media (Image or Video - Optional)
              </Label>
              
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
                {loading ? "Creating..." : "Create Event"}
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
