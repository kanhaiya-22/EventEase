"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader } from "lucide-react";

interface AttendanceData {
  valid: boolean;
  registration: {
    id: string;
    qrCode: string;
    student: {
      id: string;
      name: string;
      email: string;
      department: string | null;
    };
    event: {
      id: string;
      title: string;
    };
    status: string;
    registeredAt: string;
    attended: boolean;
    attendanceDetails: {
      checkedInAt: string;
      method: string;
    } | null;
  };
}

interface ScanResult {
  success: boolean;
  data?: AttendanceData;
  message: string;
  timestamp: Date;
}

export default function QRScannerComponent({ eventId }: { eventId: string }) {
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus on input for scanning
    if (inputRef.current && scanning) {
      inputRef.current.focus();
    }
  }, [scanning]);

  const handleQrScan = async (qrCode: string) => {
    if (!qrCode.trim()) return;

    setLoading(true);
    try {
      // First verify the QR code
      const verifyRes = await fetch(`/api/attendance?qrCode=${qrCode}`);

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        const result: ScanResult = {
          success: false,
          message: error.error || "Invalid QR code",
          timestamp: new Date(),
        };
        setCurrentResult(result);
        setScanHistory([result, ...scanHistory]);
        setQrInput("");
        return;
      }

      const verifyData = await verifyRes.json();

      // Then mark attendance
      const markRes = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode, method: "QR" }),
      });

      if (!markRes.ok) {
        const error = await markRes.json();
        const result: ScanResult = {
          success: false,
          data: verifyData.registration,
          message: error.error || "Failed to mark attendance",
          timestamp: new Date(),
        };
        setCurrentResult(result);
        setScanHistory([result, ...scanHistory]);
        setQrInput("");
        return;
      }

      const result: ScanResult = {
        success: true,
        data: verifyData.registration,
        message: "Attendance marked successfully",
        timestamp: new Date(),
      };

      setCurrentResult(result);
      setScanHistory([result, ...scanHistory]);
      setQrInput("");
    } catch (error) {
      const result: ScanResult = {
        success: false,
        message: "Error scanning QR code",
        timestamp: new Date(),
      };
      setCurrentResult(result);
      setScanHistory([result, ...scanHistory]);
      setQrInput("");
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrInput.trim()) {
      handleQrScan(qrInput);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Input */}
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualEntry} className="space-y-4">
            <div>
              <label className="text-sm font-medium">QR Code or Registration ID</label>
              <input
                ref={inputRef}
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Scan QR code or paste registration ID..."
                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !qrInput.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Mark Attendance"
              )}
            </Button>
          </form>

          {scanning && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
              💡 Use a QR code scanner device or mobile camera to scan attendance QR codes.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Result */}
      {currentResult && (
        <Card
          className={
            currentResult.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              {currentResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <CardTitle className="text-base">
                {currentResult.message}
              </CardTitle>
            </div>
          </CardHeader>
          {currentResult.data && (
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">
                    {currentResult.data.registration.student.name}
                  </p>
                  <p className="text-gray-600">
                    {currentResult.data.registration.student.email}
                  </p>
                  {currentResult.data.registration.student.department && (
                    <p className="text-gray-600">
                      {currentResult.data.registration.student.department}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Event: {currentResult.data.registration.event.title}
                  </p>
                </div>
                {currentResult.data.registration.attendanceDetails && (
                  <div className="pt-2 border-t">
                    <p className="text-gray-600">
                      Checked in: {new Date(currentResult.data.registration.attendanceDetails.checkedInAt).toLocaleTimeString("en-IN")}
                    </p>
                    <p className="text-gray-600">
                      Method: {currentResult.data.registration.attendanceDetails.method}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Scan History */}
      <Card>
        <CardHeader>
          <CardTitle>
            Scan History ({scanHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scanHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scans yet. Scan QR codes to mark attendance.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scanHistory.map((scan, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border flex items-start justify-between gap-2 ${
                    scan.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {scan.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <p className="font-medium text-sm">
                        {scan.data?.registration.student.name || "Unknown"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(scan.timestamp).toLocaleTimeString("en-IN")}
                    </p>
                  </div>
                  <Badge
                    className={
                      scan.success
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }
                  >
                    {scan.success ? "✓ Done" : "✗ Failed"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
