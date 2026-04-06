"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MigrationResult {
  filename: string;
  status: "success" | "error" | "skipped";
  cloudinaryUrl?: string;
  message: string;
}

interface LocalUrls {
  events: Array<{ id: string; title: string; posterUrl: string }>;
  certificates: Array<{ id: string; certificateUrl: string }>;
  users: Array<{ id: string; name: string; email: string; avatarUrl: string }>;
}

export default function CloudinaryMigrationPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [localUrls, setLocalUrls] = useState<LocalUrls | null>(null);
  const [migrationResults, setMigrationResults] = useState<{
    successful: number;
    failed: number;
    total: number;
    results: MigrationResult[];
  } | null>(null);
  const [error, setError] = useState("");

  async function handleCheckMigration() {
    setIsChecking(true);
    setError("");

    try {
      const response = await fetch("/api/migration/cloudinary", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to check migration status");
      }

      const data = await response.json();
      setLocalUrls(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error checking migration");
    } finally {
      setIsChecking(false);
    }
  }

  async function handleRunMigration() {
    setIsMigrating(true);
    setError("");

    try {
      const response = await fetch("/api/migration/cloudinary", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to run migration");
      }

      const data = await response.json();
      setMigrationResults({
        successful: data.summary.successful,
        failed: data.summary.failed,
        total: data.summary.total,
        results: data.results,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error running migration");
    } finally {
      setIsMigrating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cloudinary Migration</h1>
        <p className="text-muted-foreground">
          Migrate all local uploaded files to Cloudinary cloud storage
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Check Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Check Migration Status</CardTitle>
          <CardDescription>
            Scan the database for local file URLs that need migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleCheckMigration} disabled={isChecking || isMigrating}>
            {isChecking ? "Checking..." : "Check for Local Files"}
          </Button>

          {localUrls && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {localUrls.events.length}
                </div>
                <p className="text-sm text-muted-foreground">Events with local posters</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {localUrls.certificates.length}
                </div>
                <p className="text-sm text-muted-foreground">Certificates with local URLs</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {localUrls.users.length}
                </div>
                <p className="text-sm text-muted-foreground">Users with local avatars</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run Migration Card */}
      {localUrls && (localUrls.events.length > 0 || localUrls.certificates.length > 0 || localUrls.users.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Run Migration</CardTitle>
            <CardDescription>
              Upload all files to Cloudinary and update database references
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Upload all files from public/uploads to Cloudinary</li>
                <li>Update event poster URLs in database</li>
                <li>Update certificate URLs in database</li>
                <li>Update user avatar URLs in database</li>
                <li>Free up local storage space</li>
              </ul>
            </div>

            <Button 
              onClick={handleRunMigration} 
              disabled={isMigrating || isChecking}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMigrating ? "Migrating..." : "Start Migration"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Card */}
      {migrationResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-600">Migration Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {migrationResults.successful}
                </div>
                <p className="text-sm text-muted-foreground">Successful uploads</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {migrationResults.failed}
                </div>
                <p className="text-sm text-muted-foreground">Failed uploads</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {migrationResults.total}
                </div>
                <p className="text-sm text-muted-foreground">Total files processed</p>
              </div>
            </div>

            {migrationResults.results.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Migration Details</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {migrationResults.results.map((result) => (
                    <div
                      key={result.filename}
                      className={`p-3 rounded-md text-sm ${
                        result.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <div className="font-medium">{result.filename}</div>
                      <div className="text-xs opacity-75">{result.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
