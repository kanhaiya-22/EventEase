"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, CheckCircle2 } from "lucide-react";

interface StudentQRDisplayProps {
  eventTitle: string;
  studentName: string;
  qrCode: string;
  registrationId: string;
  attended?: boolean;
  attendanceTime?: string;
}

export default function StudentQRDisplay({
  eventTitle,
  studentName,
  qrCode,
  registrationId,
  attended,
  attendanceTime,
}: StudentQRDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Generate QR code on client side
    const generateQR = async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, qrCode, {
            width: 200,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });
          // Convert to image URL
          setQrImageUrl(canvasRef.current.toDataURL("image/png"));
        }
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };
    generateQR();
  }, [qrCode]);

  const downloadQR = () => {
    if (qrImageUrl) {
      const link = document.createElement("a");
      link.href = qrImageUrl;
      link.download = `${studentName}-${eventTitle}-QR.png`;
      link.click();
    }
  };

  const copyQRCode = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Your Event QR Code</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{eventTitle}</p>
          </div>
          {attended && (
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Attended
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
            <canvas ref={canvasRef} />
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadQR} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download QR
            </Button>
            <Button
              onClick={copyQRCode}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy Code"}
            </Button>
          </div>
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-900">Registration Details</p>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>QR Code:</strong> {qrCode.substring(0, 8)}...</p>
            <p><strong>Registration ID:</strong> {registrationId.substring(0, 8)}...</p>
            {attended && attendanceTime && (
              <p><strong>Attended at:</strong> {new Date(attendanceTime).toLocaleString("en-IN")}</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">📝 Instructions</p>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>Display this QR code at the event venue</li>
            <li>The organizer will scan your QR code to mark attendance</li>
            <li>You can download or share this code</li>
            {attended && <li className="text-green-700">✓ Your attendance has been marked!</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
