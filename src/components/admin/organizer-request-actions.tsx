"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface OrganizerRequestActionsProps {
  requestId: string;
  userName: string;
}

export function OrganizerRequestActions({ requestId, userName }: OrganizerRequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  async function handleAction(action: "APPROVED" | "REJECTED") {
    setLoading(action === "APPROVED" ? "approve" : "reject");

    try {
      const res = await fetch(`/api/organizer-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectionReason: action === "REJECTED" ? rejectionReason : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process request");
      }

      toast.success(
        action === "APPROVED"
          ? `${userName}'s organizer account has been approved`
          : `${userName}'s organizer request has been rejected`
      );

      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (showRejectForm) {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Rejection reason (optional)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={2}
            className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Provide a reason for rejection..."
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => handleAction("REJECTED")}
            disabled={loading === "reject"}
          >
            {loading === "reject" ? "Rejecting..." : "Confirm Reject"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowRejectForm(false);
              setRejectionReason("");
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={() => handleAction("APPROVED")}
        disabled={loading === "approve"}
      >
        <CheckCircle className="mr-1 h-4 w-4" />
        {loading === "approve" ? "Approving..." : "Approve"}
      </Button>
      <Button
        size="sm"
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={() => setShowRejectForm(true)}
      >
        <XCircle className="mr-1 h-4 w-4" />
        Reject
      </Button>
    </div>
  );
}
