"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, X, Plus, Search, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CollegeOption {
  name: string;
  slug: string;
  city: string;
  type: string;
}

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    role: string;
    department: string | null;
    year: string | null;
    phone: string | null;
    interests: string[];
    organizationSlug?: string | null;
    organizationName?: string | null;
  };
  colleges?: CollegeOption[];
  redirectTo?: string;
  submitLabel?: string;
}

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Chemical",
  "Biotechnology",
  "Mathematics",
  "Physics",
  "Other",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Alumni"];

export function ProfileForm({ user, colleges, redirectTo, submitLabel }: ProfileFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department || "");
  const [year, setYear] = useState(user.year || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [interests, setInterests] = useState<string[]>(user.interests);
  const [newInterest, setNewInterest] = useState("");
  const [loading, setLoading] = useState(false);

  const needsCollegePick = !user.organizationSlug && !!colleges && colleges.length > 0;
  const [orgSlug, setOrgSlug] = useState<string>("");
  const [orgQuery, setOrgQuery] = useState("");
  const filteredColleges = useMemo(() => {
    if (!colleges) return [];
    const q = orgQuery.trim().toLowerCase();
    if (!q) return colleges.slice(0, 50);
    return colleges
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [colleges, orgQuery]);
  const selectedCollege = useMemo(
    () => colleges?.find((c) => c.slug === orgSlug) ?? null,
    [colleges, orgSlug]
  );

  const addInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (needsCollegePick && !orgSlug) {
      toast.error("Please select your college to continue.");
      return;
    }

    setLoading(true);

    const result = await updateProfile({
      name,
      department: department || undefined,
      year: year || undefined,
      phone: phone || undefined,
      interests,
      organizationSlug: needsCollegePick ? orgSlug : undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      if (redirectTo) {
        // useSession().update(undefined) is a plain GET — it does NOT trigger
        // the jwt callback. Pass a non-undefined arg so NextAuth POSTs to
        // /api/auth/session, the jwt callback re-reads the DB, and Set-Cookie
        // refreshes the JWT before we navigate.
        await updateSession({ refresh: true });
        window.location.href = redirectTo;
      } else {
        await updateSession({ refresh: true });
        router.refresh();
      }
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {needsCollegePick && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select your college
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t auto-detect your college from{" "}
              <span className="font-medium">{user.email}</span>. Pick the institution you belong to so you can fully use EventEase.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={orgQuery}
                onChange={(e) => setOrgQuery(e.target.value)}
                placeholder="Search by name, city, or type (e.g. IIT, KGMU, Lucknow)"
                className="pl-9"
              />
            </div>

            {selectedCollege && (
              <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{selectedCollege.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCollege.city} · {selectedCollege.type}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOrgSlug("")}
                >
                  Clear
                </Button>
              </div>
            )}

            {!selectedCollege && (
              <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
                {filteredColleges.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No colleges match &quot;{orgQuery}&quot;.
                  </p>
                ) : (
                  filteredColleges.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => {
                        setOrgSlug(c.slug);
                        setOrgQuery("");
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition"
                    >
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.city} · {c.type}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Don&apos;t see your college?{" "}
              <a href="mailto:support@eventease.app" className="underline">
                Request to add it
              </a>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {user.organizationName && !needsCollegePick && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Your college
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{user.organizationName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Determined from your email and locked to your account.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user.role} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="gap-1 pr-1">
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {interests.length === 0 && (
              <p className="text-sm text-muted-foreground">No interests added yet</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add an interest (e.g., Web Dev, AI, Music)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInterest();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addInterest}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="min-w-[140px]">
          {loading ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4" />
              {submitLabel ?? "Save Changes"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
