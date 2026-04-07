"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createOrganization,
  updateOrganization,
} from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface CollegeFormProps {
  mode: "create" | "edit";
  defaultValues?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

export function CollegeForm({ mode, defaultValues }: CollegeFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultValues?.name || "");
  const [slug, setSlug] = useState(defaultValues?.slug || "");
  const [logo, setLogo] = useState(defaultValues?.logo || "");
  const [loading, setLoading] = useState(false);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (mode === "create") {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = { name, slug, logo: logo || undefined };

    const result =
      mode === "create"
        ? await createOrganization(data)
        : await updateOrganization(defaultValues!.id, data);

    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(
        mode === "create"
          ? "College created successfully"
          : "College updated successfully"
      );
      router.push("/admin/colleges");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>College Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">College Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. IET Lucknow"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. iet-lucknow"
                required
                minLength={2}
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                title="Lowercase alphanumeric with hyphens"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL (optional)</Label>
            <Input
              id="logo"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
              type="url"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/colleges")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[140px]">
          {loading ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === "create" ? "Create College" : "Save Changes"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
