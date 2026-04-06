"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  QrCode,
  Loader,
  Copy,
} from "lucide-react";

interface CheckInResult {
  success: boolean;
  message: string;
  eventTitle?: string;
  checkedInAt?: string;
  error?: string;
  timestamp: Date;
}

export default function StudentCheckInPage() {
  const [qrInput, setQrInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [checkInHistory, setCheckInHistory] = useState<CheckInResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCheckIn = async () => {
    if (!qrInput.trim()) {
      setResult({
        success: false,
        message: "Please enter your QR code",
        timestamp: new Date(),
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/attendance/self-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: qrInput.trim() }),
      });

      const data = await response.json();

      const checkInResult: CheckInResult = {
        success: response.ok,
        message: data.message || data.error,
        eventTitle: data.event?.title,
        checkedInAt: data.attendance?.checkedInAt,
        error: data.error,
        timestamp: new Date(),
      };

      setResult(checkInResult);
      setCheckInHistory([checkInResult, ...checkInHistory]);

      if (response.ok) {
        setQrInput("");
        // Clear success message after 3 seconds
        setTimeout(() => {
          setResult(null);
        }, 3000);
      }
    } catch (error) {
      const errorResult: CheckInResult = {
        success: false,
        message: "Network error. Please try again.",
        error: String(error),
        timestamp: new Date(),
      };
      setResult(errorResult);
      setCheckInHistory([errorResult, ...checkInHistory]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCheckIn();
    }
  };

  const copyQRToClipboard = (qr: string) => {
    navigator.clipboard.writeText(qr);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Check-In</h1>
        <p className="text-muted-foreground mt-1">
          Scan or paste your QR code to mark yourself as present
        </p>
      </div>

      {/* Main Check-In Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Enter Your QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">QR Code</label>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Paste your QR code here (e.g., d6c0a181-f353-4992-a9f6-2ef78a9eea4)"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              You can find your QR code in your email or in the My Registrations
              page
            </p>
          </div>

          <Button
            onClick={handleCheckIn}
            disabled={loading || !qrInput.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Checking In...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Check In
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Result */}
      {result && (
        <Card
          className={`border-2 ${
            result.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex gap-4">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    result.success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {result.message}
                </p>
                {result.eventTitle && (
                  <p className="text-sm text-gray-700 mt-1">
                    Event: {result.eventTitle}
                  </p>
                )}
                {result.checkedInAt && (
                  <p className="text-sm text-gray-700 mt-1">
                    Checked in at:{" "}
                    {new Date(result.checkedInAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Check In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <p className="font-semibold">Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to your "My Registrations" page</li>
              <li>Find the event you want to check in for</li>
              <li>Copy your QR code</li>
              <li>Paste it in the field above</li>
              <li>Click "Check In"</li>
            </ol>
          </div>
          <div className="pt-2 border-t space-y-2">
            <p className="font-semibold">Important:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Check-in opens 15 minutes before the event starts</li>
              <li>You can only check in once per event</li>
              <li>Use only your own QR code</li>
              <li>You must be registered for the event to check in</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Check-In History */}
      {checkInHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Check-In History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checkInHistory.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-start justify-between ${
                    item.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {item.success ? (
                        <Badge variant="default" className="bg-green-600">
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1 font-medium">{item.message}</p>
                    {item.eventTitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.eventTitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
